import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 获取用户档案
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("获取用户档案失败:", error);
      return null;
    }
    return data;
  }, []);

  // 密码恢复事件标记
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  // 监听认证状态变化
  useEffect(() => {
    // 获取当前 session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        const p = await fetchProfile(currentSession.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    // 监听变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        // 先处理事件类型（不要被 fetchProfile 的 await 阻塞）
        if (event === "PASSWORD_RECOVERY") {
          setPasswordRecovery(true);
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          setPasswordRecovery(false);
          return;
        }

        if (newSession?.user) {
          const p = await fetchProfile(newSession.user.id);
          setProfile(p);
          // 更新最后登录时间
          if (event === "SIGNED_IN") {
            supabase
              .from("user_profiles")
              .update({ last_login_at: new Date().toISOString() })
              .eq("id", newSession.user.id)
              .then(() => {});
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // 登录
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error };

    // 检查用户是否被禁用
    const p = await fetchProfile(data.user.id);
    if (p && !p.is_active) {
      await supabase.auth.signOut();
      return { error: { message: "账号已被禁用，请联系管理员。" } };
    }

    return { data };
  };

  // 登出
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  // 忘记密码 - 发送重置邮件
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (!error) {
      // 标记恢复意图，用于 PKCE 流程中识别 code 来源
      sessionStorage.setItem("password_recovery_pending", "true");
    }
    return { error };
  };

  // 设置新密码（重置密码或首次设置）
  const updatePassword = async (newPassword) => {
    try {
      // 先确认当前有有效会话
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        return { error: { message: "会话已过期，请重新点击邮件中的重置链接" } };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (err) {
      console.error("updatePassword exception:", err);
      return { error: { message: err.message || "密码更新请求失败，请重试" } };
    }
  };

  // 邀请用户（仅管理员）
  const inviteUser = async (email, role, displayName) => {
    if (profile?.role !== "admin") {
      return { error: { message: "无权限：仅管理员可邀请用户" } };
    }

    // 先创建邀请记录
    const { error: invError } = await supabase.from("invitations").insert({
      email,
      role,
      invited_by: session.user.id,
    });
    if (invError) return { error: invError };

    // 通过 Supabase Auth 发送邀请邮件
    // 注意：需要在 Supabase Dashboard 开启 "Enable email confirmations"
    // 并配置邀请邮件模板
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { display_name: displayName || "" },
      redirectTo: `${window.location.origin}/set-password`,
    });

    // 如果 admin API 不可用（anon key 没有 admin 权限），
    // 使用 Edge Function 或手动流程
    if (error?.message?.includes("not authorized")) {
      // 降级方案：记录邀请，管理员手动通知
      return {
        data: { fallback: true },
        message: "邀请已记录。请通过 Supabase Dashboard 手动邀请该用户，或部署 Edge Function。",
      };
    }

    return { error };
  };

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    role: profile?.role ?? null,
    isAdmin: profile?.role === "admin",
    isSales: profile?.role === "sales",
    isFormulator: profile?.role === "formulator",
    isViewer: profile?.role === "viewer",
    canEdit: profile?.role === "admin" || profile?.role === "formulator",
    canExport: profile?.role === "admin" || profile?.role === "sales" || profile?.role === "formulator",
    passwordRecovery,
    clearPasswordRecovery: () => setPasswordRecovery(false),
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    inviteUser,
    refreshProfile: () => session?.user && fetchProfile(session.user.id).then(setProfile),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

import { useState, useEffect } from "react";
import { Loader2, Layers3 } from "lucide-react";
import { useAuth } from "./hooks/useAuth.jsx";
import { LoginPage, ForgotPasswordPage, SetPasswordPage } from "./pages/AuthPages.jsx";
import App from "./App.jsx";
import { supabase } from "./lib/supabase";

/**
 * 应用外壳 - 处理认证路由
 * 根据 URL hash 和认证状态决定显示哪个页面
 */
export default function AppShell() {
  const { session, profile, loading, signIn, signOut, resetPassword, updatePassword, passwordRecovery, clearPasswordRecovery } = useAuth();
  const [page, setPage] = useState("login"); // login | forgot | set-password | reset-password | app
  const [callbackHandled, setCallbackHandled] = useState(false);

  // 处理 Supabase 认证回调（PKCE code、token_hash、hash tokens）
  useEffect(() => {
    async function handleCallback() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      const hash = window.location.hash;

      // 方式1：PKCE 流程 - URL 中有 code 参数
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Code exchange failed:", error.message);
        }
        // 清除 URL 参数
        window.history.replaceState(null, "", window.location.pathname);
        setCallbackHandled(true);
        return;
      }

      // 方式2：Token Hash 流程 - URL 中有 token_hash 参数
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type,
        });
        if (error) {
          console.error("OTP verification failed:", error.message);
        } else if (type === "recovery") {
          setPage("reset-password");
        } else if (type === "invite" || type === "signup") {
          setPage("set-password");
        }
        // 清除 URL 参数
        window.history.replaceState(null, "", window.location.pathname);
        setCallbackHandled(true);
        return;
      }

      // 方式3：旧 Implicit 流程 - hash 中有 access_token
      if (hash && (hash.includes("access_token") || hash.includes("type="))) {
        const params = new URLSearchParams(hash.substring(1));
        const hashType = params.get("type");

        if (hashType === "recovery") {
          setPage("reset-password");
        } else if (hashType === "invite" || hashType === "signup") {
          setPage("set-password");
        }
        // 清除 URL hash
        window.history.replaceState(null, "", window.location.pathname);
      }

      setCallbackHandled(true);
    }
    handleCallback();
  }, []);

  // 监听 PASSWORD_RECOVERY 事件（PKCE 流程中 code exchange 成功后触发）
  useEffect(() => {
    if (passwordRecovery && session) {
      setPage("reset-password");
    }
  }, [passwordRecovery, session]);

  // 认证状态变化时更新页面
  useEffect(() => {
    if (!callbackHandled) return;
    if (loading) return;

    if (session && profile) {
      // 如果在密码设置页面，不自动跳转
      if (page === "set-password" || page === "reset-password") return;
      setPage("app");
    } else if (!session) {
      if (page === "app") setPage("login");
    }
  }, [session, profile, loading, callbackHandled, page]);

  // 全局加载状态
  if (loading || !callbackHandled) {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <Loader2 size={32} className="spin" />
          <span>加载中…</span>
        </div>
      </div>
    );
  }

  // 忘记密码页面
  if (page === "forgot") {
    return (
      <ForgotPasswordPage
        onResetPassword={resetPassword}
        onBack={() => setPage("login")}
      />
    );
  }

  // 设置密码页面（邀请用户）
  if (page === "set-password" && session) {
    return (
      <SetPasswordPage
        onUpdatePassword={updatePassword}
        onBack={() => {
          setPage("app");
          window.history.replaceState(null, "", "/");
        }}
        isReset={false}
      />
    );
  }

  // 重置密码页面
  if (page === "reset-password" && session) {
    return (
      <SetPasswordPage
        onUpdatePassword={updatePassword}
        onBack={() => {
          clearPasswordRecovery();
          setPage("app");
          window.history.replaceState(null, "", "/");
        }}
        isReset={true}
      />
    );
  }

  // 重置密码页面但 session 尚未建立（等待中）
  if (page === "reset-password" && !session) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-mark">
              <Loader2 size={24} className="spin" />
            </div>
            <h1>验证中…</h1>
            <p>正在验证重置密码链接，请稍候。</p>
          </div>
        </div>
      </div>
    );
  }

  // 已登录且有档案 → 进入主应用
  if (session && profile) {
    return <App />;
  }

  // 默认：登录页面
  return (
    <LoginPage
      onSignIn={signIn}
      onForgotPassword={() => setPage("forgot")}
    />
  );
}

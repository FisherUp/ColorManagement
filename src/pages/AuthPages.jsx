import { useState } from "react";
import { Layers3, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

/**
 * 登录页面
 */
export function LoginPage({ onSignIn, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await onSignIn(email, password);
    if (signInError) {
      setError(getErrorMessage(signInError.message));
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark">
            <Layers3 size={24} />
          </div>
          <h1>颜色管理系统</h1>
          <p>环氧磨石销售工作台</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">邮箱地址</label>
            <div className="input-wrapper">
              <Mail size={16} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@company.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="password">密码</label>
            <div className="input-wrapper">
              <Lock size={16} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : null}
            {loading ? "登录中…" : "登录"}
          </button>

          <button
            type="button"
            className="auth-link"
            onClick={onForgotPassword}
          >
            忘记密码？
          </button>
        </form>

        <div className="auth-footer">
          <p>本系统仅限受邀用户使用</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 忘记密码页面
 */
export function ForgotPasswordPage({ onResetPassword, onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await onResetPassword(email);
    if (resetError) {
      setError(getErrorMessage(resetError.message));
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-mark">
              <Mail size={24} />
            </div>
            <h1>邮件已发送</h1>
            <p>请检查 <strong>{email}</strong> 的收件箱，点击邮件中的链接重置密码。</p>
          </div>
          <button className="auth-submit" onClick={onBack}>
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark">
            <Lock size={24} />
          </div>
          <h1>重置密码</h1>
          <p>输入你的注册邮箱，我们将发送重置链接。</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="reset-email">邮箱地址</label>
            <div className="input-wrapper">
              <Mail size={16} />
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@company.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : null}
            {loading ? "发送中…" : "发送重置链接"}
          </button>

          <button type="button" className="auth-link" onClick={onBack}>
            <ArrowLeft size={14} />
            返回登录
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * 设置密码页面（邀请用户首次设置 / 重置密码）
 */
export function SetPasswordPage({ onUpdatePassword, onBack, isReset }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("密码长度至少 8 位");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    const { error: updateError } = await onUpdatePassword(password);
    if (updateError) {
      setError(getErrorMessage(updateError.message));
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-mark success">
              <Lock size={24} />
            </div>
            <h1>密码设置成功</h1>
            <p>{isReset ? "密码已重置，" : "欢迎加入，"}即将进入系统…</p>
          </div>
          <button className="auth-submit" onClick={onBack}>
            进入系统
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark">
            <Lock size={24} />
          </div>
          <h1>{isReset ? "重置密码" : "设置密码"}</h1>
          <p>{isReset ? "请输入新密码" : "欢迎！请设置你的登录密码"}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="new-password">新密码</label>
            <div className="input-wrapper">
              <Lock size={16} />
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 位"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="confirm-password">确认密码</label>
            <div className="input-wrapper">
              <Lock size={16} />
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="password-rules">
            <span className={password.length >= 8 ? "met" : ""}>至少 8 位</span>
            <span className={confirmPassword && password === confirmPassword ? "met" : ""}>两次一致</span>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : null}
            {loading ? "设置中…" : "确认设置"}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * 翻译常见错误信息
 */
function getErrorMessage(msg) {
  if (!msg) return "未知错误";
  if (msg.includes("Invalid login credentials")) return "邮箱或密码错误";
  if (msg.includes("Email not confirmed")) return "邮箱未验证，请检查收件箱";
  if (msg.includes("User not found")) return "该邮箱未注册";
  if (msg.includes("Too many requests")) return "操作过于频繁，请稍后再试";
  if (msg.includes("Password should be")) return "密码不符合要求（至少 8 位）";
  if (msg.includes("same_password")) return "新密码不能与旧密码相同";
  return msg;
}

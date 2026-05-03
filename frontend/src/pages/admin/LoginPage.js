export default function LoginPage({
  styles,
  loginForm,
  setLoginForm,
  handleLogin,
  message,
}) {
  return (
    <div style={styles.page}>
      <div style={styles.loginWrap}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Candle Shop Admin</h1>
          <p>Login</p>

          <form onSubmit={handleLogin}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm({ ...loginForm, username: e.target.value })
              }
            />

            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
            />

            <button style={styles.button} type="submit">
              Login
            </button>
          </form>

          {message && (
            <div style={{ ...styles.message, marginTop: "16px" }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
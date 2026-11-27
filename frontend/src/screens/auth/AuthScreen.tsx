import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, Moon, User as UserIcon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface GoogleCredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (cfg: {
            client_id: string;
            callback: (res: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            el: HTMLElement,
            opts: { theme?: string; size?: string; width?: number; text?: string; shape?: string }
          ) => void;
        };
      };
    };
  }
}

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ name: boolean; email: boolean; password: boolean }>({
    name: false,
    email: false,
    password: false,
  });

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = useAppStore((s) => s.googleClientId);
  const registerLocal = useAppStore((s) => s.registerLocal);
  const loginLocal = useAppStore((s) => s.loginLocal);
  const loginWithGoogleCredential = useAppStore((s) => s.loginWithGoogleCredential);
  const loginWithGoogleLocal = useAppStore((s) => s.loginWithGoogleLocal);

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;

    const initGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (resp) => {
          if (resp.credential) {
            void loginWithGoogleCredential(resp.credential).then((res) => {
              if (!res.ok) setErrorMsg(res.error ?? 'Error en Google OAuth.');
            });
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: mode === 'register' ? 'signup_with' : 'signin_with',
        shape: 'pill',
      });
    };

    if (window.google?.accounts?.id) {
      initGoogleButton();
      return;
    }

    const scriptId = 'google-gsi-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', initGoogleButton);
    return () => {
      script?.removeEventListener('load', initGoogleButton);
    };
  }, [googleClientId, mode, loginWithGoogleCredential]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      if (mode === 'register') {
        const res = await registerLocal(name, email, password);
        if (!res.ok) setErrorMsg(res.error ?? 'Error al registrar.');
      } else {
        const res = await loginLocal(email, password);
        if (!res.ok) setErrorMsg(res.error ?? 'No pudimos iniciar sesión.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const nameInvalid = touched.name && mode === 'register' && name.trim().length < 2;
  const emailInvalid = touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passInvalid = touched.password && password.length < 6;

  return (
    <div className="min-h-dvh w-full bg-[#EAEDFF]/60 flex justify-center">
      <div className="flex min-h-dvh w-full max-w-[430px] flex-col justify-center bg-[#FAF8FF] px-5 py-8 shadow-[0_0_40px_rgba(19,27,46,0.08)]">
        {/* Hero Brand matching Figma 01.1 / 01.2 */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB] shadow-md shadow-[#2563EB]/25">
            <Moon className="h-7 w-7 text-white" fill="currentColor" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#131B2E]">
            {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h1>
          <p className="mt-1.5 max-w-[300px] text-sm text-[#434655]">
            {mode === 'login'
              ? 'Microplanifica tus entregas y protege tu descanso sin sobreestimulación.'
              : 'Empieza en menos de 1 minuto. Todo funciona incluso sin internet.'}
          </p>
        </div>

        {/* Auth Toggle */}
        <div
          className="mt-6 grid grid-cols-2 rounded-2xl bg-[#EAEDFF] p-1"
          role="tablist"
          aria-label="Modo de acceso"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${
              mode === 'login'
                ? 'bg-white text-[#131B2E] shadow-xs'
                : 'text-[#434655] hover:text-[#131B2E]'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${
              mode === 'register'
                ? 'bg-white text-[#131B2E] shadow-xs'
                : 'text-[#434655] hover:text-[#131B2E]'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Form Card */}
        <div className="mt-4 rounded-3xl border border-[#E5E7F3] bg-white p-5 shadow-xs">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {mode === 'register' ? (
              <div className="mp-field">
                <label
                  htmlFor="auth-name"
                  className="mb-1.5 block text-xs font-semibold text-[#434655]"
                >
                  Nombre completo
                </label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#737686]" />
                  <input
                    id="auth-name"
                    name="fullname"
                    type="text"
                    required
                    minLength={2}
                    autoComplete="name"
                    enterKeyHint="next"
                    placeholder="Ej. Angel García"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    aria-invalid={nameInvalid ? 'true' : 'false'}
                    aria-describedby={nameInvalid ? 'auth-name-error' : undefined}
                    className={`mp-input pl-11 ${nameInvalid ? 'user-invalid-fallback' : ''}`}
                  />
                </div>
                <p id="auth-name-error" className="mp-error-msg">
                  Error: Escribe al menos 2 caracteres para tu nombre.
                </p>
              </div>
            ) : null}

            <div className="mp-field">
              <label
                htmlFor="auth-email"
                className="mb-1.5 block text-xs font-semibold text-[#434655]"
              >
                Correo universitario
              </label>
              <span id="auth-email-hint" className="mb-1 block text-[11px] text-[#737686]">
                Formato: nombre@correo.buap.mx
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#737686]" />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  required
                  spellCheck={false}
                  autoComplete={mode === 'login' ? 'username' : 'email'}
                  enterKeyHint="next"
                  placeholder="tu.nombre@correo.buap.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  aria-invalid={emailInvalid ? 'true' : 'false'}
                  aria-describedby={
                    emailInvalid ? 'auth-email-hint auth-email-error' : 'auth-email-hint'
                  }
                  className={`mp-input pl-11 ${emailInvalid ? 'user-invalid-fallback' : ''}`}
                />
              </div>
              <p id="auth-email-error" className="mp-error-msg">
                Error: Ingresa un correo electrónico válido (ej. nombre@correo.buap.mx).
              </p>
            </div>

            <div className="mp-field">
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-xs font-semibold text-[#434655]"
              >
                Contraseña
              </label>
              {mode === 'register' ? (
                <span id="auth-pass-hint" className="mb-1 block text-[11px] text-[#737686]">
                  Mínimo 6 caracteres
                </span>
              ) : null}
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#737686]" />
                <input
                  id="auth-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  enterKeyHint="done"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  aria-invalid={passInvalid ? 'true' : 'false'}
                  aria-describedby={
                    passInvalid
                      ? mode === 'register'
                        ? 'auth-pass-hint auth-pass-error'
                        : 'auth-pass-error'
                      : mode === 'register'
                        ? 'auth-pass-hint'
                        : undefined
                  }
                  className={`mp-input pl-11 pr-11 ${passInvalid ? 'user-invalid-fallback' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-[#737686] hover:text-[#131B2E]"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p id="auth-pass-error" className="mp-error-msg">
                Error: La contraseña debe tener al menos 6 caracteres.
              </p>
            </div>

            {errorMsg ? (
              <div
                role="alert"
                className="rounded-xl border border-[#BA1A1A]/25 bg-[#FFDAD6]/60 px-3 py-2 text-xs font-medium text-[#BA1A1A]"
              >
                {errorMsg}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#2563EB] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6] transition disabled:opacity-60"
            >
              {submitting
                ? 'Conectando...'
                : mode === 'login'
                  ? 'Iniciar sesión'
                  : 'Crear cuenta y configurar perfil'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E5E7F3]" />
            <span className="text-[11px] font-medium text-[#737686]">
              {googleClientId ? 'o continúa con Google' : 'o acceso rápido'}
            </span>
            <div className="h-px flex-1 bg-[#E5E7F3]" />
          </div>

          {googleClientId ? (
            <div className="flex flex-col items-center gap-2">
              <div ref={googleBtnRef} className="flex justify-center" />
              <p className="text-center text-[10px] text-[#737686]">
                Google OAuth verificado por tu servidor MicroPlan.
              </p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void loginWithGoogleLocal()}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#E5E7F3] bg-white py-2.5 text-sm font-semibold text-[#131B2E] hover:bg-[#F2F3FF] transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                Continuar con Google (modo local)
              </button>
              <p className="mt-2 text-center text-[10px] text-[#737686]">
                Para activar Google OAuth real, pega tu <code>GOOGLE_CLIENT_ID</code> en{' '}
                <code>backend/.env</code>.
              </p>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-[#434655]">
          {mode === 'login' ? '¿No tienes cuenta aún? ' : '¿Ya tienes una cuenta? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setErrorMsg(null);
            }}
            className="font-bold text-[#2563EB] hover:underline"
          >
            {mode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}

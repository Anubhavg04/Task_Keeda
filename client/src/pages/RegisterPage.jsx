import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuArrowRight, LuEye, LuEyeOff, LuLockKeyhole, LuMail, LuUserRound } from 'react-icons/lu';
import { useAuth } from '../context/useAuth.js';
import AuthShell from '../components/AuthShell.jsx';
import toast from 'react-hot-toast';

const fieldClass = 'w-full rounded-xl border border-stone-200 bg-[#fdfcf9] py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100/70';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await register(formData.fullname, formData.email, formData.password);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      variant="signup"
      eyebrow="Your next chapter"
      title="Make space for your best work."
      description="Create your account and bring tasks, projects, and your team into one clear workspace."
    >
      <form onSubmit={handleSubmit} className="rounded-[1.4rem] border border-stone-200/80 bg-white p-6 shadow-[0_24px_70px_-35px_rgba(54,44,31,0.28)] ring-1 ring-black/[0.02] sm:p-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="fullname" className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
            <div className="relative">
              <LuUserRound aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="fullname"
                name="fullname"
                autoComplete="name"
                value={formData.fullname}
                onChange={handleChange}
                required
                maxLength={100}
                className={fieldClass}
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Work email</label>
            <div className="relative">
              <LuMail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={fieldClass}
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Create password</label>
            <div className="relative">
              <LuLockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className={`${fieldClass} pr-12`}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-stone-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
              >
                {showPassword
                  ? <LuEyeOff aria-hidden="true" className="h-[18px] w-[18px]" />
                  : <LuEye aria-hidden="true" className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</label>
            <div className="relative">
              <LuLockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                className={`${fieldClass} pr-12`}
                placeholder="Enter your password again"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-stone-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
              >
                {showConfirmPassword
                  ? <LuEyeOff aria-hidden="true" className="h-[18px] w-[18px]" />
                  : <LuEye aria-hidden="true" className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#bd4317] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(189,67,23,0.8)] transition hover:bg-[#a83712] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating your account...' : 'Create your free account'}
            {!loading && <LuArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
          </button>
        </div>

        <div className="mt-5 border-t border-stone-100 pt-5 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-orange-800 decoration-orange-300 underline-offset-4 hover:underline">Sign in</Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;

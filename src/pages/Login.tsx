import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { login } from "@/services/api";
import { useAppContext } from "@/context/AppContext";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password is too short"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "demo@parkspot.app", password: "password" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setError(null);
    try {
      const result = await login(values);
      dispatch({ type: "LOGIN", payload: result });
      navigate("/home");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <section className="mx-auto mt-12 max-w-lg space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-heading text-text">Welcome back</h1>
        <p className="text-text-muted">Log in to manage your reservations.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
          <Input label="Password" type="password" {...register("password")} error={errors.password?.message} />
          {error && <p className="text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 flex justify-between text-sm text-text-muted">
          <Link to="/auth/forgot" className="text-brand">Forgot password?</Link>
          <Link to="/auth/register" className="text-brand">Create account</Link>
        </div>
      </motion.div>
    </section>
  );
}

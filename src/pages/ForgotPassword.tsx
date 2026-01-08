import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({ email: z.string().email() });

type ForgotForm = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(() => {
    setSent(true);
  });

  return (
    <section className="mx-auto mt-10 max-w-lg">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 rounded-3xl bg-white p-8 shadow">
        <h1 className="text-3xl font-heading">Reset password</h1>
        <p className="text-text-muted">Enter your email and we will send you a magic link.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
          {sent && <p className="text-success">Check your inbox for reset instructions.</p>}
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
        <Link to="/auth/login" className="text-sm text-brand">
          Back to login
        </Link>
      </motion.div>
    </section>
  );
}

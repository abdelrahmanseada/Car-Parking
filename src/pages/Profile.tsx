import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppContext } from "@/context/AppContext";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof schema>;

export function ProfilePage() {
  const { state, dispatch } = useAppContext();
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: state.user?.name ?? "Demo Driver", email: state.user?.email ?? "demo@rideo.app", phone: state.user?.phone ?? "" },
  });

  const onSubmit = handleSubmit((values) => {
    dispatch({ type: "LOGIN", payload: { user: { ...(state.user ?? { id: "user-mock" }), ...values }, token: state.token ?? "mock-token" } });
    setMessage("Profile saved.");
  });

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-heading">Profile</h1>
        <p className="text-text-muted">Keep your contact info up to date.</p>
      </header>
      <motion.form initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-6 shadow">
        <Input label="Full name" {...register("name")} error={errors.name?.message} />
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Input label="Phone" type="tel" {...register("phone")} error={errors.phone?.message} />
        {message && <p className="text-success">{message}</p>}
        <Button type="submit">Save changes</Button>
      </motion.form>
    </section>
  );
}

"use client";

import { useState } from "react";
import { loginAction } from "@/app/admin/actions";

type LoginFormProps = {
  nextPath: string;
};

export default function LoginForm({ nextPath }: LoginFormProps) {
  const [error, setError] = useState("");

  return (
    <form
      className="admin-form"
      action={async (formData) => {
        setError("");
        const result = await loginAction(formData);
        if (result?.error) {
          setError(result.error);
        }
      }}
    >
      {error ? <p className="admin-error">{error}</p> : null}
      <input type="hidden" name="next" value={nextPath} />
      <label>
        Email
        <input type="email" name="email" required autoComplete="email" />
      </label>
      <label>
        Password
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
        />
      </label>
      <button type="submit" className="admin-btn">
        Sign in
      </button>
    </form>
  );
}

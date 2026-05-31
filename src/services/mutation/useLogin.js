import { useMutation } from "@tanstack/react-query";
import { instance } from "../../config/axios-instance";

export const useLogin = () => {
  return useMutation({
    mutationFn: ({ login, password }) =>
      instance
        .post("/auth/login", { login, password })
        .then((res) => res.data),
  });
};

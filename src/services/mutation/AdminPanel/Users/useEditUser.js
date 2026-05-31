import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "../../../../config/axios-instance";

export const useEditUser = ({ onSuccess, onError } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }) => instance.patch("/user/" + id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
    },
    onError,
  });
};
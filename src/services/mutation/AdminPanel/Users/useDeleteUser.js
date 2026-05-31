import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "../../../../config/axios-instance";

export const useDeleteUser = ({ onSuccess, onError } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => instance.delete("/user/delete/" + id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
    },
    onError,
  });
};

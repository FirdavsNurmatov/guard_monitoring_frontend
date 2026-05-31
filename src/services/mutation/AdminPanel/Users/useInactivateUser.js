import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "../../../../config/axios-instance";

export const useInactivateUser = ({ onSuccess, onError } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => instance.delete("/user/" + id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
    },
    onError,
  });
};

import { useQuery } from "@tanstack/react-query";
import { getMe, getToken } from "@/lib/auth";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !!getToken(),
    retry: false,
  });
}

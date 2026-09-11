import { z } from "zod";

export const updateMemberRoleSchema = z.object({
  roleSlug: z.string().trim().min(1),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

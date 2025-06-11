import { addUser, updateUser } from "@/app/services/user";
import { User } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export const userAction = async (data: User | Omit<User, "id">) => {
    "use server"
    let res;
    if ("id" in data) {
        res = await updateUser(data);
    } else {
        res = await addUser(data);
    }    
    if (!res.error) {
        revalidatePath(`/users/${res.payload.id}`);
        revalidatePath(`/users`);
    }
    return res;
}

export type UserAction = typeof userAction;

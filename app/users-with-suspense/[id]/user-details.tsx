"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { User } from "@/generated/prisma";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import Spinner from '@/app/components/spinner-default';
import { UserAction } from '../actions';
import { useGlobalState } from '@/app/providers/global-state-provider';

type Props = {
    user?: User,
    userAction: UserAction
}

const formSchema = z.object({
    name: z.string().min(3).max(200),
    email: z.string().email(),
    phone: z.string().regex(
        /^[+\d]?(?:[\d-.\s()]*)$/,
        { message: "Invalid phone number format" }
    )
});

const uniqueEmailReagex = new RegExp("^.+Unique constraint.+(`email`)", "s");

const UserForm: React.FC<Props> = ({ user, userAction }) => {
    const { currentState: { counter }, saveState } = useGlobalState();
    const [pending, setPending] = useState<boolean>(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: user ? {
            name: user.name,
            email: user.email,
            phone: user.phone
        } : {
            name: "",
            email: "",
            phone: ""
        },
    })

    useEffect(() => {
        console.log(user); // just to confirma cache revalidate;
    }, [user])

    function onSubmit(values: z.infer<typeof formSchema>) {
        const callAsync = async () => {
            setPending(true);
            const payload = !user ? { ...values } : { ...values, id: user.id };
            const res = await userAction(payload);
            setPending(false);
            if (res.error) {
                if (res.error.message && uniqueEmailReagex.test(res.error.message)) {
                    form.setError("email", { type: "value", message: "User with this email already exists" });
                    return;
                }
                // handle any other errors
                console.log("res ", res)
                alert("someting went wrong...")
                return
            }
            if (user) {
                const { name, email, phone } = res.payload;
                form.reset({ name, email, phone }); // makse form pristine again;
            } else {
                router.replace(`${res.payload.id}`);
            }

        }
        void callAsync(); // safe, no abort logic required; 
    }

    return (
        <div className="w-full">
            <Button onClick={() => { saveState({ counter: counter + 1 }) }}>Counter++ {counter}</Button>
            <div className="w-full pb-2 text-center">{user ? "Edit User" : "Add New User"}</div>
            <div className="p-3 ">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input placeholder="User name" {...field} disabled={pending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Email" {...field} disabled={pending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Phone" {...field} disabled={pending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className='flex flex-row items-center gap-2'>
                            <Button type="submit" disabled={!form.formState.isDirty || pending}>Submit</Button>
                            {pending && (<Spinner size="sm" />)}
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}

export default UserForm;

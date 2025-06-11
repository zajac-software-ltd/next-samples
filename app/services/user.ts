import { User } from '@/generated/prisma';

import { NotFoundError, serviceWrapper } from './service-utils';
import { prisma } from '@/lib/prisma';

const _findUsers = (searchCriteria?: Record<keyof User, string[]>) => {
    if (!searchCriteria) return prisma.user.findMany();

    const andConditions = Object.entries(searchCriteria).map(([field, values]) => ({
        OR: values.map(value => ({ [field]: value })),
    }));

    return prisma.user.findMany({
        where: andConditions.length > 0 ? { AND: andConditions } : undefined,
    });
};

const findUsers = serviceWrapper(_findUsers)

const getUserById = serviceWrapper(async (data: Pick<User, "id">) => {
    const result = await prisma.user.findUnique({ where: { id: data.id } });
    if (!result) {
        throw new NotFoundError(`User ${data.id} not found`);
    }
    return result;
})

const addUser = serviceWrapper((data: Omit<User, "id">) => (
    prisma.user.create({ data })
))

const updateUser = serviceWrapper((data: User) => {
    const { id, ...updatePayload } = data;
    return prisma.user.update({
        where: { id },
        data: updatePayload,
    })
});

const deleteUser = serviceWrapper((data: Pick<User, "id">) => (
    prisma.user.delete({ where: { id: data.id } })
))

export { findUsers, getUserById, addUser, updateUser, deleteUser }

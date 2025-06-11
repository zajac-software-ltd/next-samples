import { deleteUser, getUserById, updateUser } from '@/app/services/user';
import { handleResponse } from '../../lib/next-api-utils';

export async function GET(_: Request, { params }: { params: { id: number } }) {
  return handleResponse(getUserById({ id: +params.id }));
}

export async function PUT(req: Request, { params }: { params: { id: number } }) {
    const data = await req.json();    // TODO: validation wrapper for all req.json()
    return handleResponse(updateUser({...data, id: +params.id}));
}

export async function DELETE(_: Request, { params }: { params: { id: number } }) {
    return handleResponse(deleteUser({id: +params.id}));
}

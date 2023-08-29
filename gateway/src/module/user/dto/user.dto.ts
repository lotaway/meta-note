import type {prismaClientProvider} from "../../../utils/connect-prisma";

export namespace UserDto {

    export namespace Controller {

        export type UserId = string;
        export interface SignInParam {
            username: string
            password: string
        }
    }

    export namespace Service {
        export interface User extends Object {

        }

        export type Provider = ReturnType<typeof prismaClientProvider>;

        export interface CreateUserParams {
            email: string
            password: string
        }

        export interface CreateUserResult {

        }

        export interface GetUserByIdParams {
            id: number
        }

        export interface SignInParams extends Object {
            username: string
            password: string
        }

        export interface SignInResult {

        }

        export abstract class Class {
            protected readonly prismaClient: Provider;

            abstract createUser(params: CreateUserParams): Promise<CreateUserResult>

            abstract signIn(params: SignInParams): Promise<SignInResult>

            abstract getUserById<Result = unknown>(options?: GetUserByIdParams): Promise<Result | User>;
        }
    }
}

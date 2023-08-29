import * as nest from "@nestjs/common";
import {prismaClientProvider} from "../../utils/connect-prisma";
import {UserDto} from "./dto/user.dto";

@nest.Injectable()
export class UserService extends UserDto.Service.Class {
    protected readonly prismaClient = prismaClientProvider();

    override async createUser({email, password}) {
        return await this.prismaClient.user.create({
            data: {
                email,
                password
            }
        });
    }

    override async signIn({username, password}: UserDto.Service.SignInParams) {
        return await this.prismaClient.user.findMany({
            where: {
                email: username,
                password
            }
        });
    }

    override async getUserById({id, password}) {
        return await this.prismaClient.user.findUnique({
            where: {
                id
            }
        });
    }

    async checkUserStatus() {
        // return await this.redis
    }

    addFollower() {

    }

    getFollowers() {
        return [];
    }

    getUserBlogCount() {
        return [];
    }
}

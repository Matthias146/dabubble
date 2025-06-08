export class User {
    avatar!: number | string;
    mail!: string;
    name!: string;
    online!: boolean;
    password!: string;
    userId!: string;
    

    constructor(obj?:any){
        this.avatar = obj && obj.avatar !== undefined ? obj.avatar : '';
        this.mail = obj && obj.mail !== undefined ? obj.mail : '';
        this.name = obj && obj.name !== undefined ? obj.name : '';
        this.online = obj && obj.online !== undefined ? obj.online : false;
        this.password = obj && obj.password !== undefined ? obj.password : '';
        this.userId = obj && obj.userId !== undefined ? obj.userId : '';
    }

    public toJson(){
        return {
            avatar:this.avatar,
            mail:this.mail,
            name:this.name,
            online:this.online,
            userId:this.userId,
            password:this.password
        }
    }
}
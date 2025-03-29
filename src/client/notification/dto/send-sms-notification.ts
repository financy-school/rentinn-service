import { IsNotEmpty, IsString, IsMobilePhone } from "class-validator";

export class SendSmsNotification {
  constructor(obj: { sender: string; receiver: string; body: string }) {
    this.sender = obj.sender;
    this.receiver = obj.receiver;
    this.body = obj.body;
  }

  @IsNotEmpty()
  @IsString()
  readonly sender: string;

  @IsNotEmpty()
  @IsString()
  @IsMobilePhone()
  readonly receiver: string;

  @IsNotEmpty()
  @IsString()
  readonly body: string;
}

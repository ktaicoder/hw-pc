import SerialPort from 'serialport'
import { IHwContext, ISerialPortInfo, SerialPortHelper } from 'src/custom-types'
import { TerminalOutputTranslator } from 'src/custom-types/helper/TerminalOutputTranslator'
import value from 'threads-plugin';
import { IExMarsCubeControl } from './IExMarsCubeControl';

const DEBUG = true;
/**
 * 하드웨어 제어
 */
export class ExMarsCubeControl implements IExMarsCubeControl {    
    private _context: IHwContext | null = null;

    private faceCell: Array<Array<number>> = new Array(6);
    private faceRotDir: Array<number> = new Array(6);
    private record: Array<Array<number>> = new Array(8);
    private currentMode = new Array<number>(2);
    private recordIndex = 0;
    private protocols = {
        packetType: 11,
        header: 0,
        footer: 90,
        dongle: {
            firstCheck: 253,
            secondCheck: 254,
            thridCheck: 254,
        },
        length: {
            transmitUSB: 11,
            transmitByte: 7,
            received: 7
        },
        index: {
            menu: 0,
            face: 7,
            faceRotDirection: 7,
            recordRequest: 8,
            recordResponse: 9,
            centerColor: 9,
            cellColor: 11,
            posDirTorq: 12,
            sensingRequest: 28,
            sensingResponse: 28
        },
        action: {
            faceMove: 1,
            faceResetAll: 2,
            faceMoveWithMotor: 3
        },
        angle: {
            zero: 0,
            thirty: 1,
            sixty: 2,
            ninety: 3,
            aHundredTwenty: 4,
            aHundredFifty: 5,
            aHundredEighty: 6
        
        },
        faceColor: {
            white: 0,
            yellow: 1,
            green: 2,
            blue: 3,
            red: 4,
            purple: 5,
            all: 7
        
        },
        cellColor: {
            off: 0,
            red: 1,
            green: 2,
            blue: 3,
            yellow: 4,
            purple: 6,
            white: 7,
            skip: 8
        
        },
        rotDir: {
            brake: 0,
            cw: 1,
            ccw: 2,
            passive: 3
        },
        direction: {
            f_cw: 0,
            f_ccw: 1,
            r_cw: 2,
            r_ccw: 3,
            l_cw: 4,
            l_ccw: 5,
            u_cw: 6,
            u_ccw: 7,
            d_cw: 8,
            d_ccw: 9,
            b_cw: 10,
            b_ccw: 11
        },
        mode: {
            main: 0,
            sub: 1,
        }
    } as const;
    
    private Colors = {
        Off: 'O',
        Red: 'R',
        Green: 'G',
        Blue: 'B',
        Yellow: 'Y',
        Purple: 'P',
        White: 'W',
        Skip: 'S'
    } as const;

    /**
     * 하드웨어 컨텍스트
     * 프레임워크에서 Injection 해준다.
     * @param context
     */
    setContext = (context: IHwContext | undefined | null): void => {
        this._context = context ?? null;
    }

    /**
     * 시리얼포트 헬퍼 생성
     * 프레임워크에서 호출한다.
     * @param path 시리얼포트 패스(ex: COM1, /dev/ttyUSB0, ...)
     * @returns SerialPortHelper
     */
    static createSerialPortHelper = (path: string): SerialPortHelper => {
        const sp = new SerialPort(path, {
            autoOpen: false,
            baudRate: 115200,
            lock: false,
        });

        const parser = new TerminalOutputTranslator();
        return SerialPortHelper.create(sp, parser);
    }

    /**
     * 시리얼포트를 처리할 수 있는지 체크
     * @param portInfo
     * @returns
     */
    static isMatch = (portInfo: ISerialPortInfo): boolean => {
        return true;
        /*if (portInfo.manufacturer) {
            return portInfo.manufacturer.includes('Silicon Labs')
        }
        return false*/
    }

    private getSerialPortHelper(): SerialPortHelper | undefined {
        return this._context?.provideSerialPortHelper?.();
    }

    /**
     * @override IHwControl
     * @returns 읽기 가능 여부
     */
    isReadable = (): boolean => {
        const sp = this.getSerialPortHelper();
        return sp?.isReadable() === true;
    }

    private checkSerialPort(): SerialPortHelper {
        if (!this.isReadable()) {
            throw new Error('hw not open')
        }
        return this.getSerialPortHelper()!
    }

    async getCellColor(face: number, cell: number): Promise<string> {
        this.decodingPacket(await this.readPacket());
        const color: string = this.translationCellColorToString(this.faceCell[face][cell]);
        return color;
    }

    async getFaceColor(face: number): Promise<string[]> {
        this.decodingPacket(await this.readPacket());
        const colors: Array<string> = new Array<string>(9);

        for (let cell = 0; cell < 9; cell++) {
            colors[cell] = this.translationCellColorToString(this.faceCell[face][cell]);
        }
        return colors;
    }

    async getFaceRotationValue(face: number): Promise<string> {
        this.decodingPacket(await this.readPacket());
        switch (this.faceRotDir[face]) {
            case 3:
                return 'CW';
            case 11:
                return 'CCW';
            default:
                return '0';
        }
    }

    async getModeRecord(mode: number, record: number): Promise<number> {
        this.decodingPacket(await this.readPacket());
        return (this.record[mode][record] / 10) / 100;
    }

    async getDiceNumberRecord(record: number): Promise<number> {
        this.decodingPacket(await this.readPacket());
        return (this.record[7][record] / 10) / 100;
    }

    async getModeStatus(): Promise<string> {
        this.decodingPacket(await this.readPacket());
        const status: string = `${this.currentMode[0]}${this.currentMode[1]}`;
        return status;
    }

    async setMenuInit(): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketMenuSetting(10, 10);
        await helper.write(buffer);

    }

    async setModeSetting(main: number, sub: number): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketMenuSetting(main, sub);
        await helper.write(buffer);
    }

    async setPlayMode(scale: number): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketModeSetting(3, scale);
        await helper.write(buffer);
    }

    async setUserMode(user: number): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketModeSetting(1, user);
        await helper.write(buffer);

    }

    async setNonBrake(flag: number): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        let buffer: Array<number> = new Array<number>(11);
        switch (flag) {
            case 0:
                buffer = this.makePacketMenuSetting(13, 4,);
                break;
            case 1:
                buffer = this.makePacketMenuSetting(9, 3);
                break;
        }
        await helper.write(buffer);
    }

    async setResetAllFace(): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketResetAllFace();
        await helper.write(buffer);
    }

    async setCenterColorChange(face: number, color: number): Promise<void>{
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketSetCenterColor(face, color);
        await helper.write(buffer);
    }

    async setCellColorChange(
        face: number,
        colorCell1: number,
        colorCell2: number,
        colorCell3: number,
        colorCell4: number,
        colorCell5: number,
        colorCell6: number,
        colorCell7: number,
        colorCell8: number
    ): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketSetCellColor(
            face,
            colorCell1,
            colorCell2,
            colorCell3,
            colorCell4,
            colorCell5,
            colorCell6,
            colorCell7,
            colorCell8
        );
        await helper.write(buffer);
    }

    async setPositionDirectionTorqueChange(
        face: number,
        position: number,
        rotationDirection: number,
        torque: number
    ): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketSetPosDirTor(face, position, rotationDirection, torque);
        await helper.write(buffer);
    }

    async setFaceRotationOnlyColor(
        face: number,
        rotationDirection: number,
        angle: number
    ): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketMoveFace(face, this.calculrateAngle(rotationDirection, angle));
        await helper.write(buffer);
    }

    async setFaceRotation(face: number, rotationDirection: number, angle: number): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketFaceMoveWithMotor(face, this.calculrateAngle(rotationDirection, angle));
        await helper.write(buffer);
    }

    async setFacesRotation(
        face1: number,
        rotationDirection1: number,
        angle1: number,
        face2: number,
        rotationDirection2: number,
        angle2: number
    ): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketFacesMoveWithMotor(
            face1,
            this.calculrateAngle(rotationDirection1, angle1), 
            face2,
            this.calculrateAngle(rotationDirection2, angle2)
        );
        await helper.write(buffer);
    }

    async setSolveCube(faceColor: number, faceLocation: number, seconds: number): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort(); 
        let face: number = this.protocols.faceColor.yellow;
        let angle: number = this.protocols.angle.ninety;
        if (faceLocation % 2 == 1) {
            angle += 8;
        }
        if (faceColor == this.protocols.faceColor.green) {
            switch (faceLocation) {
                case this.protocols.direction.f_cw:
                case this.protocols.direction.f_ccw: 
                    face = this.protocols.faceColor.green;
                    break;
                case this.protocols.direction.r_cw:
                case this.protocols.direction.r_ccw:
                    face = this.protocols.faceColor.purple;
                    break;
                case this.protocols.direction.l_cw:
                case this.protocols.direction.l_ccw:
                    face = this.protocols.faceColor.red;
                    break;
                case this.protocols.direction.u_cw:
                case this.protocols.direction.u_ccw:
                    face = this.protocols.faceColor.yellow;
                    break;
                case this.protocols.direction.d_cw:
                case this.protocols.direction.d_ccw:
                    face = this.protocols.faceColor.white;
                    break;
                case this.protocols.direction.b_cw:
                case this.protocols.direction.b_ccw:
                    face = this.protocols.faceColor.blue;
                    break;
            }
        } else if (faceColor == this.protocols.faceColor.purple) {
            switch (faceLocation) {
                case this.protocols.direction.f_cw:
                case this.protocols.direction.f_ccw: 
                    face = this.protocols.faceColor.purple;
                    break;
                case this.protocols.direction.r_cw:
                case this.protocols.direction.r_ccw:
                    face = this.protocols.faceColor.blue;
                    break;
                case this.protocols.direction.l_cw:
                case this.protocols.direction.l_ccw:
                    face = this.protocols.faceColor.green;
                    break;
                case this.protocols.direction.u_cw:
                case this.protocols.direction.u_ccw:
                    face = this.protocols.faceColor.yellow;
                    break;
                case this.protocols.direction.d_cw:
                case this.protocols.direction.d_ccw:
                    face = this.protocols.faceColor.white;
                    break;
                case this.protocols.direction.b_cw:
                case this.protocols.direction.b_ccw:
                    face = this.protocols.faceColor.red;
                    break;
            }
        } else if (faceColor == this.protocols.faceColor.blue) {
            switch (faceLocation) {
                case this.protocols.direction.f_cw:
                case this.protocols.direction.f_ccw:
                    face = this.protocols.faceColor.blue;
                    break;
                case this.protocols.direction.r_cw:
                case this.protocols.direction.r_ccw:
                    face = this.protocols.faceColor.red;
                    break;
                case this.protocols.direction.l_cw:
                case this.protocols.direction.l_ccw:
                    face = this.protocols.faceColor.purple;
                    break;
                case this.protocols.direction.u_cw:
                case this.protocols.direction.u_ccw:
                    face = this.protocols.faceColor.yellow;
                    break;
                case this.protocols.direction.d_cw:
                case this.protocols.direction.d_ccw:
                    face = this.protocols.faceColor.white;
                    break;
                case this.protocols.direction.b_cw:
                case this.protocols.direction.b_ccw:
                    face = this.protocols.faceColor.green;
                    break;
            }
        } else if (faceColor == this.protocols.faceColor.red) {
            switch (faceLocation) {
                case this.protocols.direction.f_cw:
                case this.protocols.direction.f_ccw:
                    face = this.protocols.faceColor.red;
                    break;
                case this.protocols.direction.r_cw:
                case this.protocols.direction.r_ccw:
                    face = this.protocols.faceColor.green;
                    break;
                case this.protocols.direction.l_cw:
                case this.protocols.direction.l_ccw:
                    face = this.protocols.faceColor.blue;
                    break;
                case this.protocols.direction.u_cw:
                case this.protocols.direction.u_ccw:
                    face = this.protocols.faceColor.yellow;
                    break;
                case this.protocols.direction.d_cw:
                case this.protocols.direction.d_ccw:
                    face = this.protocols.faceColor.white;
                    break;
                case this.protocols.direction.b_cw:
                case this.protocols.direction.b_ccw:
                    face = this.protocols.faceColor.purple;
                    break;
            }
        }
        const buffer: Array<number> = this.makePacketFaceMoveWithMotor(face, angle);
        await helper.write(buffer);
    }

    async setPlayNote(pitchName: number, seconds: number): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        let face: number = this.protocols.faceColor.white;
        let angle: number = 3;

        if (pitchName !== 12) {
            if (pitchName % 2 == 1) {
                angle += 8;
            }
            switch (pitchName) {
                case 0:
                case 1:
                    face = this.protocols.faceColor.white;
                    break;
                case 2:
                case 3:
                    face = this.protocols.faceColor.yellow;
                    break;
                case 4:
                case 5:
                    face = this.protocols.faceColor.green;
                    break;
                case 6:
                case 7:
                    face = this.protocols.faceColor.blue;
                    break;
                case 8:
                case 9: 
                    face = this.protocols.faceColor.red;
                    break;
                case 10:
                case 11:
                    face = this.protocols.faceColor.purple;
                    break;
            }
    
            const buffer: Array<number> = this.makePacketFaceMoveWithMotor(face, angle);
            await helper.write(buffer);    
        }
    }
    async setReturnModeRecord(mode: number): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketRecord(mode);
        await helper.write(buffer);    
    }

    async setReturnDiceNumberRecord(): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketRecord(7);
        await helper.write(buffer); 
    }

    async setAutoSolveCube(): Promise<void> {
        const helper: SerialPortHelper = this.checkSerialPort();
        const buffer: Array<number> = this.makePacketRecord(7);
        await helper.write(buffer);
    }

    /**
     * 패킷 생성
     */
    private makePacket(
        index: number,
        param1: number,
        param2: number,
        param3: number,
        param4: number
    ): Array<number> {
        let buffer: Array<number>;
        
        switch (this.protocols.packetType) {
            case this.protocols.length.transmitUSB:
                buffer = new Array<number>(this.protocols.length.transmitUSB)
                buffer[0] = this.protocols.header;
                buffer[1] = index;
                buffer[2] = param1;
                buffer[3] = param2;
                buffer[4] = param3;
                buffer[5] = param4;
                buffer[6] = this.protocols.footer;
                buffer[7] = this.protocols.length.received;
                buffer[8] = this.protocols.dongle.firstCheck;
                buffer[9] = this.protocols.dongle.secondCheck;
                buffer[10] = this.protocols.dongle.thridCheck;
            break;
            default:             
                buffer = new Array<number>(this.protocols.length.transmitUSB)
                buffer[0] = this.protocols.header;
                buffer[1] = index;
                buffer[2] = param1;
                buffer[3] = param2;
                buffer[4] = param3;
                buffer[5] = param4;
                buffer[6] = this.protocols.footer;
            break;
        }

        return buffer;
    }

    private makePacketMenuSetting(main: number, sub: number): Array<number> {
        return this.makePacket(this.protocols.index.menu, 11, main, sub, 255);
    }

    private makePacketModeSetting(index: number, mode: number): Array<number> {
        return this.makePacket(this.protocols.index.menu, 30, index, mode, 255);
    }

    private makePacketSetCenterColor(face: number, color: number): Array<number> {
        const index: number = ((face << 5) | this.protocols.index.centerColor);

        return this.makePacket(index, color, 0, 0, 0);
    }

    private makePacketSetCellColor(
        face: number,
        color1: number,
        color2: number,
        color3: number,
        color4: number,
        color5: number,
        color6: number,
        color7: number,
        color8: number
    ): Array<number> {
        const index: number = ((face << 5) | this.protocols.index.cellColor);
        const para1: number = (color1 << 4) | color2;
        const para2: number = (color3 << 4) | color4;
        const para3: number = (color5 << 4) | color6;
        const para4: number = (color7 << 4) | color8;
        
        return this.makePacket(index, para1, para2, para3, para4);
    }

    private makePacketSetPosDirTor(
        face: number,
        position: number,
        direction: number,
        torque: number
    ): Array<number> {
        const index = ((face << 5) | this.protocols.index.posDirTorq);
        let pos: number = 0;

        if (position < 2) {
            pos = 2;
        } else if (position > 141) {
            pos = 141;
        } else {
            pos = position;
        }

        return this.makePacket(index, pos, direction, torque, 0);
    }

    private makePacketMoveFace(face: number, rotation: number): Array<number> {
        let para: number = 0;
        let buffer: Array<number> = new Array<number>(this.protocols.packetType);

        if (0 <= rotation && rotation <= 15) {
            if (face === this.protocols.faceColor.white ||
                face === this.protocols.faceColor.green ||
                face === this.protocols.faceColor.red) {
                para = (rotation << 4) & 240;
            }
            else if (face === this.protocols.faceColor.yellow ||
                    face === this.protocols.faceColor.blue ||
                    face === this.protocols.faceColor.purple) {
                para = rotation & 15;
            }
        }

        if (face === this.protocols.faceColor.white || face === this.protocols.faceColor.yellow) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMove, para, 0, 0);
        } else if (face === this.protocols.faceColor.green || face === this.protocols.faceColor.blue) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMove, 0, para, 0);
        } else if (face === this.protocols.faceColor.red || face === this.protocols.faceColor.purple) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMove, 0, 0, para);
        }

        return buffer;
    }

    private makePacketResetAllFace(): Array<number> {
        return this.makePacket(this.protocols.index.face, this.protocols.action.faceResetAll, 0, 0, 0);
    }

    private makePacketFaceMoveWithMotor(face: number, rotation: number): Array<number> {
        let para: number = 0;
        let buffer: Array<number> = new Array<number>(this.protocols.packetType);

        if (0 <= rotation && rotation <= 15) {
            if (face === this.protocols.faceColor.white ||
                face === this.protocols.faceColor.green ||
                face === this.protocols.faceColor.red) {
                para = (rotation << 4) & 240;
            } else if (face === this.protocols.faceColor.yellow ||
                     face === this.protocols.faceColor.blue ||
                     face === this.protocols.faceColor.purple) {
                para = rotation & 15;
            }
        }

        if (face === this.protocols.faceColor.white || face === this.protocols.faceColor.yellow) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMoveWithMotor, para, 0, 0);
        } else if (face === this.protocols.faceColor.green || face === this.protocols.faceColor.blue) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMoveWithMotor, 0, para, 0);
        } else if (face === this.protocols.faceColor.red || face === this.protocols.faceColor.purple) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMoveWithMotor, 0, 0, para);
        }

        return buffer;
    }
    
    private makePacketFacesMoveWithMotor(face1: number, rotation1: number, face2: number, rotation2: number): Array<number> {
        let para2: number = 0;
        let para3: number = 0;
        let para4: number = 0;
        
        switch (face1) {
            case this.protocols.faceColor.white: para2 |= (rotation1 << 4) & 240; break;
            case this.protocols.faceColor.yellow: para2 |= rotation1 & 15; break;
            case this.protocols.faceColor.green: para3 |= (rotation1 << 4) & 240; break;
            case this.protocols.faceColor.blue: para3 |= rotation1 & 15; break;
            case this.protocols.faceColor.red: para4 |= (rotation1 << 4) & 240; break;
            case this.protocols.faceColor.purple: para4 |= rotation1 & 15; break;
        }        
        switch (face2) {
            case this.protocols.faceColor.white: para2 |= (rotation2 << 4) & 240; break;
            case this.protocols.faceColor.yellow: para2 |= rotation2 & 15; break;
            case this.protocols.faceColor.green: para3 |= (rotation2 << 4) & 240; break;
            case this.protocols.faceColor.blue: para3 |= rotation2 & 15; break;
            case this.protocols.faceColor.red: para4 |= (rotation2 << 4) & 240; break;
            case this.protocols.faceColor.purple: para4 |= rotation2 & 15; break;
        }

        return this.makePacket(this.protocols.index.face, this.protocols.action.faceMoveWithMotor, para2, para3, para4);
    }

    private makePacketRecord(recordIndex: number): Array<number> {
        const index: number = ((7 << 5) | this.protocols.index.recordRequest);
        this.recordIndex = recordIndex;
        return this.makePacket(index, recordIndex, 255, 255, 255);
    }

    private makePacketSensingRequest(face: number): Array<number> {
        const index: number = ((face << 5) | this.protocols.index.sensingRequest);

        return this.makePacket(index, 255, 255, 255, 255);
    }

    private async readPacket(): Promise<Buffer> {
        const helper = this.checkSerialPort();
        const sendBuffer: Array<number> = this.makePacketSensingRequest(this.protocols.faceColor.all);
        await helper.write(sendBuffer);
        const readBuffer: Buffer = await helper.readNext();
        if (DEBUG) console.log(readBuffer);
        return readBuffer;
    }


    private decodingPacket(packet: Buffer): void {
        let face: number;
        var index: number = packet[1] & 31;

        if (index === this.protocols.index.menu)
        {
            this.currentMode[0] = packet[3];
            this.currentMode[1] = packet[4];
        } else if (index === this.protocols.index.sensingResponse) {
            face = (packet[1] >> 5) & 15;

            if (0 <= face && face <= 5) {
                if (face === this.protocols.faceColor.white) {
                    this.faceCell[face][0] = (packet[3] >> 4) & 15;
                    this.faceCell[face][1] = packet[3] & 15;
                    this.faceCell[face][2] = (packet[4] >> 4) & 15;
                    this.faceCell[face][3] = packet[4] & 15;
                    this.faceCell[face][4] = (packet[5] >> 4) & 15;
                    this.faceCell[face][5] = packet[5] & 15;
                    this.faceCell[face][6] = (packet[2] >> 4) & 15;
                    this.faceCell[face][7] = packet[2] & 15;
                } else if (face === this.protocols.faceColor.yellow) {
                    this.faceCell[face][0] = (packet[2] >> 4) & 15;
                    this.faceCell[face][1] = packet[2] & 15;
                    this.faceCell[face][2] = (packet[3] >> 4) & 15;
                    this.faceCell[face][3] = packet[3] & 15;
                    this.faceCell[face][4] = (packet[4] >> 4) & 15;
                    this.faceCell[face][5] = packet[4] & 15;
                    this.faceCell[face][6] = (packet[5] >> 4) & 15;
                    this.faceCell[face][7] = packet[5] & 15;
                } else if (face === this.protocols.faceColor.green) {
                    this.faceCell[face][0] = (packet[3] >> 4) & 15;
                    this.faceCell[face][1] = packet[3] & 15;
                    this.faceCell[face][2] = (packet[4] >> 4) & 15;
                    this.faceCell[face][3] = packet[4] & 15;
                    this.faceCell[face][4] = (packet[5] >> 4) & 15;
                    this.faceCell[face][5] = packet[5] & 15;
                    this.faceCell[face][6] = (packet[2] >> 4) & 15;
                    this.faceCell[face][7] = packet[2] & 15;
                } else if (face === this.protocols.faceColor.blue) {
                    this.faceCell[face][0] = (packet[4] >> 4) & 15;
                    this.faceCell[face][1] = packet[4] & 15;
                    this.faceCell[face][2] = (packet[5] >> 4) & 15;
                    this.faceCell[face][3] = packet[5] & 15;
                    this.faceCell[face][4] = (packet[2] >> 4) & 15;
                    this.faceCell[face][5] = packet[2] & 15;
                    this.faceCell[face][6] = (packet[3] >> 4) & 15;
                    this.faceCell[face][7] = packet[3] & 15;
                } else if (face === this.protocols.faceColor.red) {
                    this.faceCell[face][0] = (packet[3] >> 4) & 15;
                    this.faceCell[face][1] = packet[3] & 15;
                    this.faceCell[face][2] = (packet[4] >> 4) & 15;
                    this.faceCell[face][3] = packet[4] & 15;
                    this.faceCell[face][4] = (packet[5] >> 4) & 15;
                    this.faceCell[face][5] = packet[5] & 15;
                    this.faceCell[face][6] = (packet[2] >> 4) & 15;
                    this.faceCell[face][7] = packet[2] & 15;
                } else if (face === this.protocols.faceColor.purple) {
                    this.faceCell[face][0] = (packet[4] >> 4) & 15;
                    this.faceCell[face][1] = packet[4] & 15;
                    this.faceCell[face][2] = (packet[5] >> 4) & 15;
                    this.faceCell[face][3] = packet[5] & 15;
                    this.faceCell[face][4] = (packet[2] >> 4) & 15;
                    this.faceCell[face][5] = packet[2] & 15;
                    this.faceCell[face][6] = (packet[3] >> 4) & 15;
                    this.faceCell[face][7] = packet[3] & 15;
                }
            } else if (face === 7) {
                this.faceCell[0][0] = (((packet[2] & 3) << 1) | (packet[3] >> 7) & 1) & 7;
                this.faceCell[0][1] = (packet[3] >> 4) & 7;
                this.faceCell[0][2] = (packet[3] >> 1) & 7;
                this.faceCell[0][3] = (((packet[3] & 1) << 2) | (packet[4] >> 6) & 3) & 7;
                this.faceCell[0][4] = (packet[4] >> 3) & 7;
                this.faceCell[0][5] = packet[4] & 7;
                this.faceCell[0][6] = (packet[2] >> 5) & 7;
                this.faceCell[0][7] = (packet[2] >> 2) & 7;
    
                this.faceCell[1][0] = (packet[5] >> 5) & 7;
                this.faceCell[1][1] = (packet[5] >> 2) & 7;
                this.faceCell[1][2] = (((packet[5] & 3) << 1) | (packet[6] >> 7) & 1) & 7;
                this.faceCell[1][3] = (packet[6] >> 4) & 7;
                this.faceCell[1][4] = (packet[6] >> 1) & 7;
                this.faceCell[1][5] = (((packet[6] & 1) << 2) | (packet[7] >> 6) & 3) & 7;
                this.faceCell[1][6] = (packet[7] >> 3) & 7;
                this.faceCell[1][7] = packet[7] & 7;
    
                this.faceCell[2][0] = (((packet[8] & 3) << 1) | (packet[9] >> 7) & 1) & 7;
                this.faceCell[2][1] = (packet[9] >> 4) & 7;
                this.faceCell[2][2] = (packet[9] >> 1) & 7;
                this.faceCell[2][3] = (((packet[9] & 1) << 2) | (packet[10] >> 6) & 3) & 7;
                this.faceCell[2][4] = (packet[10] >> 3) & 7;
                this.faceCell[2][5] = packet[10] & 7;
                this.faceCell[2][6] = (packet[8] >> 5) & 7;
                this.faceCell[2][7] = (packet[8] >> 2) & 7;
    
                this.faceCell[3][0] = (packet[12] >> 1) & 7;
                this.faceCell[3][1] = (((packet[12] & 1) << 2) | (packet[13] >> 6) & 3) & 7;
                this.faceCell[3][2] = (packet[13] >> 3) & 7;
                this.faceCell[3][3] = packet[13] & 7;
                this.faceCell[3][4] = (packet[11] >> 5) & 7;
                this.faceCell[3][5] = (packet[11] >> 2) & 7;
                this.faceCell[3][6] = (((packet[11] & 3) << 1) | (packet[12] >> 7) & 1) & 7;
                this.faceCell[3][7] = (packet[12] >> 4) & 7;
    
                this.faceCell[4][0] = (((packet[14] & 3) << 1) | (packet[15] >> 7) & 1) & 7;
                this.faceCell[4][1] = (packet[15] >> 4) & 7;
                this.faceCell[4][2] = (packet[15] >> 1) & 7;
                this.faceCell[4][3] = (((packet[15] & 1) << 2) | (packet[16] >> 6) & 3) & 7;
                this.faceCell[4][4] = (packet[16] >> 3) & 7;
                this.faceCell[4][5] = packet[16] & 7;
                this.faceCell[4][6] = (packet[14] >> 5) & 7;
                this.faceCell[4][7] = (packet[14] >> 2) & 7;
    
                this.faceCell[5][0] = (packet[18] >> 1) & 7;
                this.faceCell[5][1] = (((packet[18] & 1) << 2) | (packet[19] >> 6) & 3) & 7;
                this.faceCell[5][2] = (packet[19] >> 3) & 7;
                this.faceCell[5][3] = packet[19] & 7;
                this.faceCell[5][4] = (packet[17] >> 5) & 7;
                this.faceCell[5][5] = (packet[17] >> 2) & 7;
                this.faceCell[5][6] = (((packet[17] & 3) << 1) | (packet[18] >> 7) & 1) & 7;
                this.faceCell[5][7] = (packet[18] >> 4) & 7;            
            }
        } else if (index === this.protocols.index.faceRotDirection) {
            if (packet[2] === 1) {
                this.faceRotDir[0] = (packet[3] >> 4) & 15; // 흰
                this.faceRotDir[1] = packet[3] & 15;        // 노
                this.faceRotDir[2] = (packet[4] >> 4) & 15; // 녹
                this.faceRotDir[3] = packet[4] & 15;        // 파
                this.faceRotDir[4] = (packet[5] >> 4) & 15; // 빨
                this.faceRotDir[5] = packet[5] & 15;        // 보
            }
        } else if (index === this.protocols.index.recordResponse) {
            // 0 : 최신
            // 1 : 차순
            // ---
            //5 : 최고
            this.record[this.recordIndex][packet[2]] = (packet[3] << 16) | (packet[4] << 8) | packet[5];
        }    
    }

    private calculrateAngle(rotation: number, angle: number): number {
        return rotation === 2 ? angle += 8 : angle;
    }

    private translationFaceNameToInt(faceName: string): number {
        switch (faceName) {
            case this.Colors.White:
                return this.protocols.faceColor.white;
            case this.Colors.Yellow:
                return this.protocols.faceColor.yellow;
            case this.Colors.Green:
                return this.protocols.faceColor.green;
            case this.Colors.Blue:
                return this.protocols.faceColor.blue;
            case this.Colors.Red:
                return this.protocols.faceColor.red;
            case this.Colors.Purple:
                return this.protocols.faceColor.purple;
            default:
                return -1;
        }
    }
    
    private translationCellColorToString(cellColor: number): string {
        switch (cellColor) {
            case this.protocols.cellColor.off:
                return this.Colors.Off;
            case this.protocols.cellColor.red:
                return this.Colors.Red;
            case this.protocols.cellColor.green:
                return this.Colors.Green;
            case this.protocols.cellColor.blue:
                return this.Colors.Blue;
            case this.protocols.cellColor.yellow:
                return this.Colors.Yellow;
            case this.protocols.cellColor.purple:
                return this.Colors.Purple;
            case this.protocols.cellColor.white:
                return this.Colors.White;
            case this.protocols.cellColor.skip:
                return this.Colors.Skip;
            default:
                return 'undefind';
        }
    }

    private translationColorNameToInt(colorName: string): number {        
        switch (colorName) {
            case this.Colors.Red:
                return this.protocols.cellColor.red;
            case this.Colors.Green:
                return this.protocols.cellColor.green;
            case this.Colors.Blue:
                return this.protocols.cellColor.blue;
            case this.Colors.Yellow:
                return this.protocols.cellColor.yellow;
            case this.Colors.Purple:
                return this.protocols.cellColor.purple;
            case this.Colors.White:
                return this.protocols.cellColor.white;
            case this.Colors.Skip:
                return this.protocols.cellColor.skip;
            default:
                return -1;
        }
    }

    private translationRotationToProtocols(rotation: string): number {
        switch (rotation) {
            case '0':
                return this.protocols.angle.zero;
            case '30':
                return this.protocols.angle.thirty;
            case '60':
                return this.protocols.angle.sixty;
            case '90':
                return this.protocols.angle.ninety;
            case '120':
                return this.protocols.angle.aHundredTwenty;
            case '150':
                return this.protocols.angle.aHundredFifty;
            case '180':
                return this.protocols.angle.aHundredEighty;
            default:
                return -1;
        }
    }

    private translationDirectionToProtocols(direction: string): number {
        switch (direction) {
            case 'Brake':
                return this.protocols.rotDir.brake;
            case 'CW':
                return this.protocols.rotDir.cw;
            case 'CCW':
                return this.protocols.rotDir.ccw;
            case 'Passive':
                return this.protocols.rotDir.passive;
            default:
                return -1;
        }
    }

    /**
     * 하드웨어 연결 시 자동 호출
     */
    async onAfterOpen(): Promise<void> {
        if (DEBUG) console.log('exMars-Cube onAfterOpen()');
        
        // 변수 및 배열 초기화
        for (let i = 0; i < this.faceCell.length; i++) {
            this.faceCell[i] = new Array<number>(9);
        }
        this.faceCell[this.protocols.faceColor.white][8] = this.protocols.cellColor.white;
        this.faceCell[this.protocols.faceColor.yellow][8] = this.protocols.cellColor.yellow;
        this.faceCell[this.protocols.faceColor.green][8] = this.protocols.cellColor.green;
        this.faceCell[this.protocols.faceColor.blue][8] = this.protocols.cellColor.blue;
        this.faceCell[this.protocols.faceColor.red][8] = this.protocols.cellColor.red;
        this.faceCell[this.protocols.faceColor.purple][8] = this.protocols.cellColor.purple;
        
        for (let i = 0; i < this.record.length; i++) {
            this.record[i] = new Array<number>(6);
        }
        
        this.makePacketSensingRequest(this.protocols.faceColor.yellow);
    }

    /**
     * 연결 종료 시 자동 호출
     * 함수인자는 없어야 함
     */
    async onBeforeClose(): Promise<void> {
        if (DEBUG) console.log('exMars-Cube onBeforeClose()');
    }
}
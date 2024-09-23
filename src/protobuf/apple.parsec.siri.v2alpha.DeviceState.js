// @generated by protobuf-ts 2.9.4 with parameter generate_dependencies,long_type_number,output_javascript
// @generated from protobuf file "apple.parsec.siri.v2alpha.DeviceState.proto" (syntax proto3)
// tslint:disable
// @generated by protobuf-ts 2.9.4 with parameter generate_dependencies,long_type_number,output_javascript
// @generated from protobuf file "apple.parsec.siri.v2alpha.DeviceState.proto" (syntax proto3)
// tslint:disable
import { MessageType } from "@protobuf-ts/runtime";
// @generated message type with reflection information, may provide speed optimized methods
class DeviceState$Type extends MessageType {
    constructor() {
        super("DeviceState", [
            { no: 1, name: "companionName", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "deviceName", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "inputOrigin", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 6, name: "isAppleTv", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 7, name: "isCarDnd", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 8, name: "isCarPlay", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 9, name: "isEyesFree", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 10, name: "isHomePod", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 11, name: "isLockedWithPasscode", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 12, name: "isMac", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 13, name: "isMultiUser", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 14, name: "isPad", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 15, name: "isPhone", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 16, name: "isTextToSpeechEnabled", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 17, name: "isVox", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 18, name: "isVoiceGenderFemale", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 19, name: "isVoiceGenderMale", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 20, name: "isVoiceGenderUnknown", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 21, name: "isVoiceTriggerEnabled", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 22, name: "isWatch", kind: "scalar", opt: true, T: 8 /*ScalarType.BOOL*/ },
            { no: 23, name: "siriLocale", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 24, name: "userAssignedDeviceName", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
}
/**
 * @generated MessageType for protobuf message DeviceState
 */
export const DeviceState = new DeviceState$Type();
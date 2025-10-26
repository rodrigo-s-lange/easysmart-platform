// Device DTO definitions
export class DeviceRegistrationDto {
    constructor(data) {
        this.deviceId = data.deviceId;
        this.name = data.name;
        this.type = data.type;
        this.firmwareVersion = data.firmwareVersion;
        this.entities = data.entities || [];
        this.config = data.config || {};
    }

    validate() {
        if (!this.deviceId) throw new Error('Device ID is required');
        if (!this.name) throw new Error('Device name is required');
        if (!this.type) throw new Error('Device type is required');
        return true;
    }
}

export class DeviceEntityDto {
    constructor(data) {
        this.entityId = data.entityId;
        this.deviceId = data.deviceId;
        this.type = data.type; // sensor, switch, light, etc.
        this.name = data.name;
        this.config = data.config || {};
        this.state = data.state;
    }

    validate() {
        if (!this.entityId) throw new Error('Entity ID is required');
        if (!this.deviceId) throw new Error('Device ID is required');
        if (!this.type) throw new Error('Entity type is required');
        return true;
    }
}

export class TelemetryDto {
    constructor(data) {
        this.deviceId = data.deviceId;
        this.entityId = data.entityId;
        this.value = data.value;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.metadata = data.metadata || {};
    }

    validate() {
        if (!this.deviceId) throw new Error('Device ID is required');
        if (!this.entityId) throw new Error('Entity ID is required');
        if (this.value === undefined) throw new Error('Value is required');
        return true;
    }
}
import React, {Component} from 'react';
import {
    Button,
    Platform,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';

var base64js = require('base64-js');
import { Buffer } from 'buffer';

export default class App extends Component {

    constructor() {
        super();

        this.manager = new BleManager();
    }


    componentWillMount() {
        const subscription = this.manager.onStateChange((state) => {
            if (state === 'PoweredOn') {
                this.scanAndConnect();
                subscription.remove();
            }
        }, true);
    }

    scanAndConnect = () => {
        this.manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                throw error;
            }
            if (device && device.name && device.name.toLowerCase().includes('contour')) {
                console.log(`Found a new Contour Device: ${device.name}`);
                this.manager.stopDeviceScan();
                device.connect().then(async (deviceInfo) => {
                    let device = await deviceInfo.discoverAllServicesAndCharacteristics();
                    let services = await device.services();
                    services.forEach(async (s) => {
                        let chars = await s.characteristics();
                        await console.log(`Found a new Service, id: ${s.id} with ${chars.length} characteristics`);
                        await chars.forEach(async (c) => {
                            if (c.isReadable) {
                                let data = await c.read();
                                await console.log(`Characteristic ID: ${data.id}, uuid: ${data.uuid}, serviceUUID: ${data.serviceUUID}`);
                                let byteArr = base64js.toByteArray(data.value);
                                await console.log(`Characteristic ID: ${data.id}, byteArr: [${this.objectByteArrayToSimpleByteArray(byteArr)}]`);
                                const buffer = await new Buffer(data.value, 'base64');
                                await console.log(`Characteristic ID: ${data.id}, Decoded base64 to string: ${buffer.toString()}`);
                                await console.log(`Characteristic ID: ${data.id}, value: ${data.value}, writableWithResponse: ${data.isWritableWithResponse}`);
                                /*
                                if (data.isWritableWithResponse) {
                                    //let value = "Chris-Contour";
                                    let value = 'Q2hyaXMtQ29udG91cg==';
                                    let updatedChar = await data.writeWithResponse(value);
                                    console.log(`We updated a Characteristic, its value is now: ${updatedChar.value}`);
                                }
                                */
                            } else {
                                await console.log(`Characteristic ID: ${c.id} - NOT READABLE`);
                            }
                        })
                    })
                    console.log(`id: ${device.id}`);
                    /*
                    await console.log(`Connected Contour Device: ${device.name}, id: ${device.id}, isConnected: ${JSON.stringify(await device.isConnected())}`);
                    let services = await device.services();
                    services.forEach(async (s) => {
                        let characteristics = await s.characteristics();
                        await this.testCharacteristics(characteristics);
                    })
                    */
                }).catch((error) => {
                    console.log(error);
                })
            }
        })
    }

    objectByteArrayToSimpleByteArray(byteArray) {
        let simpleArr = [];
        let arr = Object.keys(byteArray);
        arr.forEach((keyName) => {
            simpleArr.push(byteArray[keyName]);
        })
        return simpleArr;
    }

    testCharacteristics = (arr) => {
        arr.forEach(async (c) => {
            if (c.isReadable) {
                let read = await c.read();
                console.log(`Characteristic ID: ${read.id}, deviceID: ${read.deviceID}, readable: ${read.isReadable}, value: ${read.value}`);
            } else {
                console.log(`Characteristic is not readable! ID: ${c.id}`);
            }
        })
    }

    render() {
        return (
            <View style={styles.container}>
                <Text>123</Text>
                <Button title='Press' onPress={() => this.scanAndConnect()} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    }
});

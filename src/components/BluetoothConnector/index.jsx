import { useState, useEffect } from "react";

const BluetoothConnector = () => {
  const [deviceName, setDeviceName] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const [receivedData, setReceivedData] = useState("");
  const [rxCharacteristic, setRxCharacteristic] = useState(null);
  const [txCharacteristic, setTxCharacteristic] = useState(null);

  const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
  const CHARACTERISTIC_UUID_RX = "beb5483e-36e1-4688-b7f5-ea07361b26a8"; // Para escribir
  const CHARACTERISTIC_UUID_TX = "beb5483e-36e1-4688-b7f5-ea07361b26a8"; // Para recibir datos

  useEffect(() => {
    if (device) {
      device.addEventListener("gattserverdisconnected", handleDisconnect);
      return () => {
        device.removeEventListener("gattserverdisconnected", handleDisconnect);
      };
    }
  }, [device]);

  const connectToDevice = async () => {
    try {
      const selectedDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID]
      });

      setDeviceName(selectedDevice.name);
      setDevice(selectedDevice);
      await connectToGatt(selectedDevice);
      setIsConnected(true);
    } catch (error) {
      console.error("Error en la conexión GATT:", error);
      alert("Error al conectar: " + error.message);
    }
  };

  const connectToGatt = async (selectedDevice) => {
    try {
      const server = await selectedDevice.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      const rxChar = await service.getCharacteristic(CHARACTERISTIC_UUID_RX);
      const txChar = await service.getCharacteristic(CHARACTERISTIC_UUID_TX);

      setRxCharacteristic(rxChar);
      setTxCharacteristic(txChar);

      await txChar.startNotifications();
      txChar.addEventListener("characteristicvaluechanged", handleDataReceived);
    } catch (error) {
      console.error("Error en la conexión GATT:", error);
    }
  };

  const handleDataReceived = (event) => {
    const value = event.target.value;
    const received = new TextDecoder().decode(value);
    setReceivedData((prevData) => prevData + "\n" + received);
    console.log("Datos recibidos:", received);
  };

  const sendData = async (message) => {
    if (rxCharacteristic) {
      try {
        await rxCharacteristic.writeValue(new TextEncoder().encode(message));
        console.log("Mensaje enviado:", message);
      } catch (error) {
        console.error("Error al enviar datos:", error);
      }
    } else {
      console.error("No se encontró la característica RX.");
    }
  };

  const disconnectDevice = () => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setDevice(null);
    setDeviceName(null);
    setRxCharacteristic(null);
    setTxCharacteristic(null);
    alert("El dispositivo se ha desconectado.");
  };

  return (
    <div className="p-6 border-2 border-blue-500 rounded-lg bg-blue-100 shadow-lg text-center">
      <h2 className="text-3xl font-bold text-gray-800">Conectar Bluetooth</h2>
      {isConnected ? (
        <div>
          <button onClick={disconnectDevice} className="px-6 py-2 bg-red-500 text-white rounded-lg">
            Desconectar
          </button>
          <p>Conectado a: {deviceName}</p>
          <p>Datos recibidos:</p>
          <textarea value={receivedData} readOnly className="border p-2 w-full h-32 rounded" />
          <input type="text" id="messageInput" className="border p-2 rounded w-full mt-2" placeholder="Escribe un mensaje..." />
          <button onClick={() => sendData(document.getElementById("messageInput").value)} className="mt-2 px-6 py-2 bg-green-500 text-white rounded-lg">
            Enviar mensaje
          </button>
        </div>
      ) : (
        <button onClick={connectToDevice} className="mt-3 px-6 py-2 bg-blue-500 text-white rounded-lg">
          Buscar dispositivos
        </button>
      )}
    </div>
  );
};

export default BluetoothConnector;
import { useState } from "react";

const BluetoothConnector = () => {
  const [deviceName, setDeviceName] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const [receivedData, setReceivedData] = useState("");
  const [rxCharacteristic, setRxCharacteristic] = useState(null);
  const [txCharacteristic, setTxCharacteristic] = useState(null);

  const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
  const CHARACTERISTIC_UUID_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // Para escribir
  const CHARACTERISTIC_UUID_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // Para recibir datos

  // Conectar a un dispositivo Bluetooth
  const connectToDevice = async () => {
    try {
      const selectedDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID],
      });

      setDeviceName(selectedDevice.name || "Dispositivo sin nombre");
      setDevice(selectedDevice);

      selectedDevice.addEventListener("gattserverdisconnected", handleDisconnect);

      await connectToGatt(selectedDevice);
      setIsConnected(true);
      console.log("Conectado a", selectedDevice.name);
    } catch (error) {
      alert("Error al conectar: " + error.message);
      console.error(error);
    }
  };

  // Manejar la desconexión del dispositivo
  const handleDisconnect = () => {
    setIsConnected(false);
    setDevice(null);
    setDeviceName(null);
    setRxCharacteristic(null);
    setTxCharacteristic(null);
    alert("El dispositivo se ha desconectado.");
  };

  // Conectar al GATT Server y obtener características
  const connectToGatt = async (selectedDevice) => {
    try {
      const server = await selectedDevice.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      // Obtener características RX (escritura) y TX (lectura)
      const rxChar = await service.getCharacteristic(CHARACTERISTIC_UUID_RX);
      const txChar = await service.getCharacteristic(CHARACTERISTIC_UUID_TX);

      setRxCharacteristic(rxChar);
      setTxCharacteristic(txChar);

      // Suscribirse a notificaciones para recibir datos
      await txChar.startNotifications();
      txChar.addEventListener("characteristicvaluechanged", handleDataReceived);
    } catch (error) {
      console.error("Error en la conexión GATT:", error);
    }
  };

  // Manejar la recepción de datos desde el ESP32
  const handleDataReceived = (event) => {
    const value = event.target.value;
    const received = new TextDecoder().decode(value);
    setReceivedData((prevData) => prevData + "\n" + received);
    console.log("Datos recibidos:", received);
  };

  // Enviar datos al dispositivo
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

  // Desconectar el dispositivo manualmente
  const disconnectDevice = () => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
    }
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
        <button onClick={connectToDevice} className="px-6 py-2 bg-blue-500 text-white rounded-lg">
          Buscar dispositivos
        </button>
      )}
    </div>
  );
};

export default BluetoothConnector;

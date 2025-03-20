import { useState } from "react";


const BluetoothConnector = () => {
  const [deviceName, setDeviceName] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [receivedData, setReceivedData] = useState("");
  const [rxCharacteristic, setRxCharacteristic] = useState(null);

  const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
  const CHARACTERISTIC_UUID_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
  const CHARACTERISTIC_UUID_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

  // Conectar a un dispositivo Bluetooth
  const connectToDevice = async () => {
    try {
      const selectedDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
      });

      const name = selectedDevice.name || "Dispositivo sin nombre";
      setDeviceName(name);
      setDevice(selectedDevice);

      selectedDevice.addEventListener("gattserverdisconnected", () => {
        setIsConnected(false);
        console.log("Dispositivo desconectado");
      });

      const server = await selectedDevice.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      // Configurar notificaciones en TX
      const txCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID_TX);
      txCharacteristic.addEventListener("characteristicvaluechanged", handleDataReceived);
      await txCharacteristic.startNotifications();

      // Guardar la característica RX para envíos futuros
      const rxCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID_RX);
      setRxCharacteristic(rxCharacteristic);

      setIsConnected(true);
      console.log("Conectado a", name);
    } catch (error) {
      console.error("Error al conectar:", error);
      alert("Error: " + error.message);
    }
  };

  // Manejar la recepción de datos desde el ESP32
  const handleDataReceived = (event) => {
    const value = event.target.value;
    const received = new TextDecoder().decode(value);
    setReceivedData(received);
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

  return (
    <div className="p-6 border-2 border-blue-500 rounded-lg bg-blue-100 shadow-lg text-center">
      <h2 className="text-3xl font-bold text-gray-800">Conectar Bluetooth</h2>
      {isConnected ? (
        <div>
          <button onClick={connectToDevice} className="px-6 py-2 bg-blue-500 text-white rounded-lg">
            Buscar Dispositivos
          </button>
          <button onClick={() => device.gatt.disconnect()} className="px-6 py-2 bg-red-500 text-white rounded-lg">
            Desconectar
          </button>
          <p>Conectado a: {deviceName}</p>
          <p>Datos recibidos: {receivedData}</p>
          <input type="text" id="messageInput" className="border p-2 rounded" />
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

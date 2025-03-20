import React, { useState } from "react";

const BLEConnect = () => {
  const [device, setDevice] = useState(null);
  const [server, setServer] = useState(null);
  const [characteristicRX, setCharacteristicRX] = useState(null);
  const [characteristicTX, setCharacteristicTX] = useState(null);
  const [log, setLog] = useState("");

  const SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
  const TX_UUID = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"; // Notificación (TX desde ESP32)
  const RX_UUID = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"; // Escritura (RX hacia ESP32)

  const logMessage = (msg) => setLog((prev) => prev + msg + "\n");

  // Conectar con el dispositivo BLE
  const connectToDevice = async () => {
    try {
      logMessage("Solicitando dispositivo BLE...");
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: false,
        filters: [{ name: "ESP32_BLE_UART" }],
        optionalServices: [SERVICE_UUID],
      });

      setDevice(device);
      logMessage(`Dispositivo encontrado: ${device.name}`);

      const server = await device.gatt.connect();
      setServer(server);
      logMessage("Conectado al servidor GATT");

      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristicTX = await service.getCharacteristic(TX_UUID);
      const characteristicRX = await service.getCharacteristic(RX_UUID);

      setCharacteristicTX(characteristicTX);
      setCharacteristicRX(characteristicRX);

      // Activar notificaciones
      characteristicTX.addEventListener("characteristicvaluechanged", handleNotifications);
      await characteristicTX.startNotifications();
      logMessage("Notificaciones habilitadas");

    } catch (error) {
      logMessage("Error: " + error.message);
    }
  };

  // Manejar las notificaciones que llegan desde el ESP32
  const handleNotifications = (event) => {
    let value = new TextDecoder().decode(event.target.value);
    logMessage("Recibido: " + value);
  };

  // Enviar un mensaje al ESP32
  const sendMessage = async () => {
    if (characteristicRX) {
      const message = "¡Hola ESP32!";
      await characteristicRX.writeValue(new TextEncoder().encode(message));
      logMessage("Enviado: " + message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">ESP32 BLE UART</h2>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded m-2"
        onClick={connectToDevice}
      >
        Conectar al ESP32
      </button>
      <button
        className="px-4 py-2 bg-green-500 text-white rounded m-2"
        onClick={sendMessage}
        disabled={!characteristicRX}
      >
        Enviar mensaje
      </button>
      <pre className="mt-4 p-2 border border-gray-300 bg-gray-100">{log}</pre>
    </div>
  );
};

export default BLEConnect;


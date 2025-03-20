import { useState } from "react";
import './BluetoothConnector.css'; // Importa el archivo CSS

const BluetoothConnector = () => {
  const [deviceName, setDeviceName] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null); // Información del dispositivo
  const [receivedData, setReceivedData] = useState(""); // Datos recibidos

  // UUIDs del servicio y las características del ESP32
  const SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"; // UART Service
  const CHARACTERISTIC_UUID_RX = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"; // RX (Write)
  const CHARACTERISTIC_UUID_TX = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"; // TX (Notify)

  
  const connectToDevice = async () => {
    try {
      // Solicitar dispositivo y declarar los servicios que quieres acceder
      const selectedDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true, // Acepta todos los dispositivos
        optionalServices: [
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // UUID del servicio UART de ESP32
          'battery_service', // Si también deseas acceder al servicio de batería
          'device_information', // Si deseas acceder al servicio de información del dispositivo
        ]
      });
  
      const deviceName = selectedDevice.name || "Dispositivo sin nombre";
      setDeviceName(deviceName);
      setIsConnected(true);
      setDevice(selectedDevice);
  
      // Obtener información adicional del dispositivo
      const info = await getDeviceInfo(selectedDevice);
      setDeviceInfo(info);
  
      console.log("Conectado a", deviceName);
    } catch (error) {
      alert("Error al conectar con el dispositivo: " + error.message);
      console.error(error);
    }
  };
   
  // Desconectar el dispositivo Bluetooth
  const disconnectDevice = () => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
      setIsConnected(false);
      setDeviceName(null);
      setDevice(null);
      setDeviceInfo(null);
      setReceivedData(""); // Limpiar los datos recibidos
      console.log("Dispositivo desconectado");
    }
  };

  // Obtener información del dispositivo, como el nombre de los servicios
  const getDeviceInfo = async (selectedDevice) => {
    try {
      const server = await selectedDevice.gatt.connect();
      const services = await server.getPrimaryServices();
      
      // Mostrar los servicios disponibles
      console.log("Servicios disponibles:", services);
      services.forEach(service => {
        console.log("UUID del servicio:", service.uuid);
      });
  
      // Si el servicio UART está disponible, obtener el nivel de batería
      let batteryLevel = null;
      if (services.some(service => service.uuid === "battery_service")) {
        const batteryService = await server.getPrimaryService("battery_service");
        const batteryLevelCharacteristic = await batteryService.getCharacteristic("battery_level");
        const batteryData = await batteryLevelCharacteristic.readValue();
        batteryLevel = batteryData.getUint8(0); // El nivel de batería está en el primer byte
      }
  
      return {
        services: services.map(service => service.uuid),
        batteryLevel,
      };
    } catch (error) {
      console.error("Error al obtener la información del dispositivo:", error);
      alert("Error al conectar con el dispositivo: " + error.message); 
      return { services: [], batteryLevel: null }; 
    }
  };

  // Conectar al GATT server y establecer notificación en TX
  const connectToGatt = async (selectedDevice) => {
    try {
      const server = await selectedDevice.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const txCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID_TX);
      
      // Configurar notificación para recibir datos
      txCharacteristic.startNotifications();
      txCharacteristic.addEventListener("characteristicvaluechanged", handleDataReceived);
    } catch (error) {
      console.error("Error al conectar al GATT server:", error);
    }
  };

  // Manejar la recepción de datos desde el ESP32
  const handleDataReceived = (event) => {
    const value = event.target.value;
    const received = new TextDecoder().decode(value);
    setReceivedData(received);
    console.log("Datos recibidos:", received);
  };

  // Enviar datos al dispositivo (al RX)
  const sendData = async (message) => {
    if (device && device.gatt.connected) {
      try {
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        const rxCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID_RX);
        await rxCharacteristic.writeValue(new TextEncoder().encode(message)); // Enviar mensaje
        console.log("Mensaje enviado:", message);
      } catch (error) {
        console.error("Error al enviar datos:", error);
      }
    }
  };

  return (
    <div className="p-6 border-2 border-blue-500 rounded-lg bg-blue-100 shadow-lg text-center">
      <h2 className="text-3xl font-bold text-gray-800">Conectar Bluetooth</h2>

      {isConnected ? (
        <div>
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={disconnectDevice}
              className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-300"
            >
              Desconectar
            </button>
            <button
              onClick={connectToDevice}
              className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Buscar Dispositivos
            </button>
          </div>
          <p className="mt-2 text-xl">Conectado a: {deviceName}</p>

          <div className="mt-4 bg-gray-200 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">Información del dispositivo:</h3>
            <p><strong>Servicios:</strong></p>
            <ul>
              {deviceInfo?.services && deviceInfo.services.length > 0 ? (
                deviceInfo.services.map((service, index) => (
                  <li key={index}>Servicio: {service}</li>
                ))
              ) : (
                <li>No se encontraron servicios.</li>
              )}
            </ul>

            <div className="mt-4">
              <h4 className="font-semibold">Datos recibidos:</h4>
              <p>{receivedData}</p>
            </div>

            <div className="mt-4">
              <input
                type="text"
                placeholder="Escribe un mensaje"
                className="border p-2 rounded"
                id="messageInput"
              />
              <button
                onClick={() => sendData(document.getElementById("messageInput").value)}
                className="mt-2 px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300"
              >
                Enviar mensaje
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={connectToDevice}
          className="px-6 py-2 mt-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Buscar dispositivos
        </button>
      )}
    </div>
  );
};

export default BluetoothConnector;


import { useState } from "react";
import './BluetoothConnector.css'; // Importa el archivo CSS

const BluetoothConnector = () => {
  const [deviceName, setDeviceName] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null); // Información del dispositivo

  // Conectar a un dispositivo Bluetooth
  const connectToDevice = async () => {
    try {
      const selectedDevice = await navigator.bluetooth.requestDevice({
        optionalServices: ["battery_service", "device_information"],
        acceptAllDevices: true,
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
      alert("Error al conectar: " + error.message);
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
      console.log("Dispositivo desconectado");
    }
  };

  // Obtener información del dispositivo, como el nombre de los servicios
  const getDeviceInfo = async (selectedDevice) => {
    try {
      const server = await selectedDevice.gatt.connect();
      const services = await server.getPrimaryServices();
      const serviceNames = services.map((service) => service.uuid);

      let batteryLevel = null;
      if (serviceNames.includes("battery_service")) {
        const batteryService = await server.getPrimaryService("battery_service");
        const batteryLevelCharacteristic = await batteryService.getCharacteristic("battery_level");
        const batteryData = await batteryLevelCharacteristic.readValue();
        batteryLevel = batteryData.getUint8(0); // El nivel de batería está en el primer byte
      }
      console.log(batteryLevel)

      return {
        services: serviceNames,
        batteryLevel, 
      };
    } catch (error) {
      console.error("Error al obtener la información del dispositivo:", error);
      alert("Error al conectar con el dispositivo: " + error.message); 
      return { services: [], batteryLevel: null }; 
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

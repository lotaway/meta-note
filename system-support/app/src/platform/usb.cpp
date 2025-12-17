#include "usb.h"

/*SPDRP_FRIENDLYNAME：设备的友好名称。
    - SPDRP_HARDWAREID：设备的硬件ID。
    - SPDRP_DEVICEDESC：设备的描述。
    - SPDRP_MFG：设备的制造商。
    - SPDRP_CLASS：设备的类别。*/
struct UsbDeviceInfo
{
    char name[256];
    char id[256];
    char desc[256];
    char mfg[256];
    char _class[256];
};

bool get_device_info_a(HDEVINFO deviceInfoSet, SP_DEVINFO_DATA &deviceInfoData, DWORD word, PBYTE buffer)
{
    return SetupDiGetDeviceRegistryPropertyA(deviceInfoSet, &deviceInfoData, word, NULL, buffer, sizeof(buffer), NULL);
}

bool get_device_info_u(HDEVINFO deviceInfoSet, SP_DEVINFO_DATA &deviceInfoData, DWORD word, PBYTE buffer)
{
    return SetupDiGetDeviceRegistryPropertyW(deviceInfoSet, &deviceInfoData, word, NULL, buffer, sizeof(buffer), NULL);
}

class DevicesInfoGetter
{
private:
    HDEVINFO deviceInfoSet;
    SP_DEVINFO_DATA &deviceInfoData;

public:
    DevicesInfoGetter(HDEVINFO _deviceInfoSet, SP_DEVINFO_DATA &_deviceInfoData) : deviceInfoSet(_deviceInfoSet), deviceInfoData(_deviceInfoData)
    {
    }

    std::optional<UsbDeviceInfo> get_infos_a()
    {
        UsbDeviceInfo usb_device_info;
        if (!get_name(*usb_device_info.name))
        {
            return std::nullopt;
        }
        if (!get_info_a(SPDRP_HARDWAREID, *usb_device_info.id))
        {
            // return std::nullopt;
        }
        if (!get_info_a(SPDRP_DEVICEDESC, *usb_device_info.desc))
        {
            // return std::nullopt;
        }
        if (!get_info_a(SPDRP_MFG, *usb_device_info.mfg))
        {
            // return std::nullopt;
        }
        if (!get_info_a(SPDRP_CLASS, *usb_device_info._class))
        {
            // return std::nullopt;
        }
        return usb_device_info;
    }

    UsbDeviceInfo get_infos_u()
    {
        UsbDeviceInfo usb_device_info;
        get_info_u(SPDRP_FRIENDLYNAME, usb_device_info.name);
        get_info_u(SPDRP_HARDWAREID, usb_device_info.id);
        get_info_u(SPDRP_DEVICEDESC, usb_device_info.desc);
        get_info_u(SPDRP_MFG, usb_device_info.mfg);
        get_info_u(SPDRP_CLASS, usb_device_info._class);
        return usb_device_info;
    }

    bool get_info_a(DWORD word, char &buffer)
    {
        return SetupDiGetDeviceRegistryPropertyA(deviceInfoSet, &deviceInfoData, word, NULL, (PBYTE)buffer, sizeof(buffer), NULL);
    }

    std::optional<char *> get_info_a(DWORD word)
    {
        char buffer[256];
        if (get_info_a(word, *buffer))
        {
            return buffer;
        }
    }

    std::optional<char *> get_name()
    {
        return get_info_a(SPDRP_FRIENDLYNAME);
    }

    bool get_name(char &buffer)
    {
        return get_info_a(SPDRP_FRIENDLYNAME, buffer);
    }

    bool get_info_u(DWORD word, char buffer[])
    {
        return get_device_info_u(deviceInfoSet, deviceInfoData, word, (PBYTE)buffer);
    }
};

int get_usb_devices()
{
    HDEVINFO deviceInfoSet = SetupDiGetClassDevs(NULL, "USB", NULL, DIGCF_PRESENT | DIGCF_ALLCLASSES);
    if (deviceInfoSet == INVALID_HANDLE_VALUE)
    {
        std::cout << "Failed to get device information." << std::endl;
        return 1;
    }

    SP_DEVINFO_DATA deviceInfoData;
    deviceInfoData.cbSize = sizeof(SP_DEVINFO_DATA);

    UsbDeviceInfo defaultInfo{"empty"};
    for (DWORD i = 0; SetupDiEnumDeviceInfo(deviceInfoSet, i, &deviceInfoData); i++)
    {
        char name[256];
        if (SetupDiGetDeviceRegistryPropertyA(deviceInfoSet, &deviceInfoData, SPDRP_FRIENDLYNAME, NULL, (PBYTE)name, sizeof(name), NULL))
        {
            std::cout << "NAME: " << name << std::endl;
        }
        if (get_device_info_a(deviceInfoSet, deviceInfoData, SPDRP_FRIENDLYNAME, (PBYTE)name))
        {
            std::cout << "LNAME: " << name << std::endl;
        }
        DevicesInfoGetter devices_info_getter{deviceInfoSet, deviceInfoData};
        std::optional<UsbDeviceInfo> usb_device_info = devices_info_getter.get_infos_a();
        std::wcout << L"USB Serial Port in AMSI: " << usb_device_info.value_or(defaultInfo).name << std::endl;
        // UsbDeviceInfo usb_device_info_u = devices_info_getter.get_infos_u();
        // std::cout << "USB Serial Port in Unicode: " << usb_device_info_u.name << ", " << usb_device_info_u.id << ", " << usb_device_info_u.desc << ", " << usb_device_info_u.mfg << ", " << usb_device_info_u._class << std::endl;
    }

    SetupDiDestroyDeviceInfoList(deviceInfoSet);

    return 0;
}
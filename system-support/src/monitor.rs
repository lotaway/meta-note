use napi_derive::napi;
use once_cell::sync::Lazy;
use std::sync::Mutex;
use sysinfo::{Disks, Networks, System};

static SYS: Lazy<Mutex<System>> = Lazy::new(|| Mutex::new(System::new_all()));

#[napi(object)]
#[derive(Clone)]
pub struct CpuInfo {
    pub name: String,
    pub vendor_id: String,
    pub frequency: i64,
    pub usage: f64,
}

#[napi(object)]
#[derive(Clone)]
pub struct MemoryInfo {
    pub total_gb: f64,
    pub used_gb: f64,
    pub free_gb: f64,
    pub usage_percent: f64,
    pub swap_total_gb: f64,
    pub swap_used_gb: f64,
}

#[napi(object)]
#[derive(Clone)]
pub struct NetworkInfo {
    pub interface_name: String,
    pub received_bytes: i64,
    pub transmitted_bytes: i64,
    pub received_packets: i64,
    pub transmitted_packets: i64,
}

#[napi(object)]
#[derive(Clone)]
pub struct DiskInfo {
    pub mount_point: String,
    pub total_gb: f64,
    pub used_gb: f64,
    pub free_gb: f64,
    pub usage_percent: f64,
    pub file_system: String,
}

#[napi(object)]
#[derive(Clone)]
pub struct ProcessInfo {
    pub pid: i32,
    pub name: String,
    pub cpu_usage: f64,
    pub memory_mb: f64,
    pub status: String,
}

#[napi(object)]
#[derive(Clone)]
pub struct SystemInfo {
    pub hostname: String,
    pub os_version: String,
    pub kernel_version: String,
    pub uptime_seconds: i64,
    pub physical_cores: i32,
    pub logical_cores: i32,
    pub cpu_usage_global: f64,
}

fn refresh<'a>() -> std::sync::MutexGuard<'a, System> {
    let mut sys = SYS.lock().unwrap();
    sys.refresh_all();
    sys
}

#[napi]
pub fn get_system_info() -> SystemInfo {
    let sys = refresh();
    let cpus = sys.cpus();
    let global_usage = sys.global_cpu_usage();
    SystemInfo {
        hostname: System::host_name().unwrap_or_default(),
        os_version: System::os_version().unwrap_or_default(),
        kernel_version: System::kernel_version().unwrap_or_default(),
        uptime_seconds: System::uptime() as i64,
        physical_cores: sys.physical_core_count().unwrap_or(0) as i32,
        logical_cores: cpus.len() as i32,
        cpu_usage_global: global_usage as f64,
    }
}

#[napi]
pub fn get_cpu_info() -> Vec<CpuInfo> {
    let sys = refresh();
    sys.cpus()
        .iter()
        .map(|cpu| CpuInfo {
            name: cpu.name().to_string(),
            vendor_id: cpu.vendor_id().to_string(),
            frequency: cpu.frequency() as i64,
            usage: cpu.cpu_usage() as f64,
        })
        .collect()
}

#[napi]
pub fn get_memory_info() -> MemoryInfo {
    let sys = refresh();
    let total = sys.total_memory();
    let used = sys.used_memory();
    MemoryInfo {
        total_gb: total as f64 / 1024.0 / 1024.0 / 1024.0,
        used_gb: used as f64 / 1024.0 / 1024.0 / 1024.0,
        free_gb: (total - used) as f64 / 1024.0 / 1024.0 / 1024.0,
        usage_percent: if total > 0 {
            used as f64 / total as f64 * 100.0
        } else {
            0.0
        },
        swap_total_gb: sys.total_swap() as f64 / 1024.0 / 1024.0 / 1024.0,
        swap_used_gb: sys.used_swap() as f64 / 1024.0 / 1024.0 / 1024.0,
    }
}

#[napi]
pub fn get_network_info() -> Vec<NetworkInfo> {
    // Networks is a separate type in sysinfo 0.33
    let networks = Networks::new_with_refreshed_list();
    networks
        .iter()
        .map(|(name, data)| NetworkInfo {
            interface_name: name.to_string(),
            received_bytes: data.total_received() as i64,
            transmitted_bytes: data.total_transmitted() as i64,
            received_packets: data.total_packets_received() as i64,
            transmitted_packets: data.total_packets_transmitted() as i64,
        })
        .collect()
}

#[napi]
pub fn get_disk_info() -> Vec<DiskInfo> {
    let disks = Disks::new_with_refreshed_list();
    disks
        .iter()
        .map(|disk| {
            let total = disk.total_space();
            let available = disk.available_space();
            let used = total - available;
            DiskInfo {
                mount_point: disk.mount_point().to_string_lossy().to_string(),
                total_gb: total as f64 / 1024.0 / 1024.0 / 1024.0,
                used_gb: used as f64 / 1024.0 / 1024.0 / 1024.0,
                free_gb: available as f64 / 1024.0 / 1024.0 / 1024.0,
                usage_percent: if total > 0 {
                    used as f64 / total as f64 * 100.0
                } else {
                    0.0
                },
                file_system: disk.file_system().to_string_lossy().to_string(),
            }
        })
        .collect()
}

#[napi]
pub fn get_process_list() -> Vec<ProcessInfo> {
    let sys = refresh();
    sys.processes()
        .iter()
        .map(|(pid, process)| ProcessInfo {
            pid: pid.as_u32() as i32,
            name: process.name().to_string_lossy().to_string(),
            cpu_usage: process.cpu_usage() as f64,
            memory_mb: process.memory() as f64 / 1024.0 / 1024.0,
            status: format!("{:?}", process.status()),
        })
        .collect()
}

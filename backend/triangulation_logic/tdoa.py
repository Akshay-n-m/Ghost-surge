import numpy as np
from scipy.optimize import least_squares

# Sound speed in deep-sea environments (salinity and temp adjusted)
SOUND_SPEED_M_S = 1500.0

def pinpoint_intruder(sensor_coords, tdoa_values):
    """
    Uses least-squares to find the intersection of hyperbolas defined by the time delays.
    
    :param sensor_coords: numpy array of shape (N, 2) or (N, 3) representing hydrophone coordinates.
    :param tdoa_values: numpy array of shape (N-1,) representing time difference of arrival relative to sensor 0.
    :return: Estimated coordinates of the acoustic source.
    """
    sensor_coords = np.array(sensor_coords)
    tdoa_values = np.array(tdoa_values)
    
    if len(sensor_coords) < 3:
        raise ValueError("At least 3 sensors are required for 2D TDOA triangulation.")
    
    # Distance differences (relative to sensor 0)
    dd = tdoa_values * SOUND_SPEED_M_S
    
    ref_sensor = sensor_coords[0]
    other_sensors = sensor_coords[1:]
    
    def residuals(target_pos):
        # Distance from target to ref sensor
        dist_ref = np.linalg.norm(target_pos - ref_sensor)
        
        # Distances from target to other sensors
        dist_others = np.linalg.norm(target_pos - other_sensors, axis=1)
        
        # Model predicted distance differences
        predicted_dd = dist_others - dist_ref
        
        return predicted_dd - dd

    # Initial guess (center of the sensors)
    initial_guess = np.mean(sensor_coords, axis=0)
    
    result = least_squares(residuals, initial_guess)
    
    if result.success:
        return result.x
    else:
        raise Exception(f"Triangulation failed: {result.message}")

if __name__ == "__main__":
    # Example usage for 3 hydrophones
    hydrophones = [
        [0.0, 0.0],       # Sensor 0 (Ref)
        [1000.0, 0.0],    # Sensor 1
        [500.0, 1000.0]   # Sensor 2
    ]
    
    # Simulate a target at [300, 400]
    target = np.array([300.0, 400.0])
    
    dist_ref = np.linalg.norm(target - np.array(hydrophones[0]))
    dist_1 = np.linalg.norm(target - np.array(hydrophones[1]))
    dist_2 = np.linalg.norm(target - np.array(hydrophones[2]))
    
    # Calculate time delays relative to sensor 0
    delays = [
        (dist_1 - dist_ref) / SOUND_SPEED_M_S,
        (dist_2 - dist_ref) / SOUND_SPEED_M_S
    ]
    
    estimated_pos = pinpoint_intruder(hydrophones, delays)
    print(f"Target simulated at: {target}")
    print(f"Estimated position: {estimated_pos}")
    print(f"Error distance: {np.linalg.norm(target - estimated_pos):.4f} meters")

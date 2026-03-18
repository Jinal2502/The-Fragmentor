from services.crc_service import crc_encode, crc_check
from services.hamming_service import hamming_encode, hamming_check

def test_crc():
    print("Testing CRC...")
    data = "1011"
    divisor = "101"
    encoded = crc_encode(data, divisor)
    print(f"Encoded CRC: {encoded['encoded']}")
    check_valid = crc_check(encoded['encoded'], divisor)
    print(f"Check Valid: {check_valid['is_valid']}")
    
    # Inject error
    invalid_data = encoded['encoded'][:-1] + ("1" if encoded['encoded'][-1] == "0" else "0")
    check_invalid = crc_check(invalid_data, divisor)
    print(f"Check Invalid (with error): {check_invalid['is_valid']}")

def test_hamming():
    print("\nTesting Hamming...")
    data = "1011"
    encoded = hamming_encode(data)
    print(f"Encoded Hamming: {encoded['encoded']}")
    check_valid = hamming_check(encoded['encoded'])
    print(f"Check Valid: {check_valid['is_valid']}")
    
    # Inject error
    invalid_bits = list(encoded['encoded'])
    invalid_bits[2] = "1" if invalid_bits[2] == "0" else "0"
    invalid_data = "".join(invalid_bits)
    check_invalid = hamming_check(invalid_data)
    print(f"Check Invalid (with error): {check_invalid['is_valid']}")
    print(f"Error fixed? Corrected: {check_invalid['corrected_encoded']}, Correct: {encoded['encoded']}")

if __name__ == "__main__":
    test_crc()
    test_hamming()

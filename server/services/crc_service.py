def xor(a: str, b: str) -> str:
    """Perform XOR of two binary strings."""
    result = []
    for i in range(1, len(b)):
        if a[i] == b[i]:
            result.append("0")
        else:
            result.append("1")
    return "".join(result)

def crc_encode(data: str, divisor: str) -> dict:
    """Compute CRC for given data and divisor."""
    n = len(divisor)
    # Append n-1 zeros to data
    padded_data = data + "0" * (n - 1)
    
    # Division process
    steps = []
    current = padded_data[:n]
    i = n
    
    while i <= len(padded_data):
        steps.append(f"Current segment: {current}")
        if current[0] == "1":
            # XOR with divisor
            res = xor(divisor, current)
            steps.append(f"XOR {current} with {divisor} -> {res}")
            if i < len(padded_data):
                current = res + padded_data[i]
            else:
                current = res
        else:
            # XOR with zeros
            res = xor("0" * n, current)
            steps.append(f"XOR {current} with {'0'*n} -> {res}")
            if i < len(padded_data):
                current = res + padded_data[i]
            else:
                current = res
        i += 1
    
    remainder = current
    encoded_data = data + remainder
    return {
        "encoded": encoded_data,
        "remainder": remainder,
        "steps": steps
    }

def crc_check(encoded_data: str, divisor: str) -> dict:
    """Check if the encoded data has errors using CRC."""
    n = len(divisor)
    steps = []
    current = encoded_data[:n]
    i = n
    
    while i <= len(encoded_data):
        steps.append(f"Current segment: {current}")
        if current[0] == "1":
            res = xor(divisor, current)
            steps.append(f"XOR {current} with {divisor} -> {res}")
            if i < len(encoded_data):
                current = res + encoded_data[i]
            else:
                current = res
        else:
            res = xor("0" * n, current)
            steps.append(f"XOR {current} with {'0'*n} -> {res}")
            if i < len(encoded_data):
                current = res + encoded_data[i]
            else:
                current = res
        i += 1
    
    remainder = current
    is_valid = "1" not in remainder
    return {
        "is_valid": is_valid,
        "remainder": remainder,
        "steps": steps
    }

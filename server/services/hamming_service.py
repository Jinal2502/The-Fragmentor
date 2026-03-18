def hamming_encode(data: str) -> dict:
    """Implement Hamming code (7,4) as an example, or general Hamming."""
    m = len(data)
    # Binary string to int list
    d = [int(bit) for bit in data]
    
    # Calculate number of parity bits required
    r = 0
    while (2**r) < (m + r + 1):
        r += 1
    
    # Create the code with placeholders for parity bits
    res = []
    j = 0
    k = 0
    for i in range(1, m + r + 1):
        if i == 2**j:
            res.append(None) # Parity bit position
            j += 1
        else:
            res.append(d[k]) # Data bit position
            k += 1
            
    steps = [f"Initial code structure: {list(enumerate(res, 1))}"]
    
    # Calculate parity bits
    for i in range(r):
        pos = 2**i
        parity = 0
        for j in range(1, len(res) + 1):
            if j & pos: # Check if the bit position has 'i-th' bit set in binary
                if res[j-1] is not None:
                    parity ^= res[j-1]
        res[pos-1] = parity
        steps.append(f"Parity bit at {pos} set to {parity}")
        
    encoded = "".join(str(bit) for bit in res)
    return {
        "encoded": encoded,
        "steps": steps,
        "parity_bits_count": r
    }

def hamming_check(encoded_data: str) -> dict:
    """Implement Hamming correction."""
    res = [int(bit) for bit in encoded_data]
    n = len(res)
    r = 0
    while (2**r) < n:
        r += 1
        
    error_pos = 0
    steps = []
    
    for i in range(r):
        pos = 2**i
        parity = 0
        for j in range(1, n + 1):
            if j & pos:
                parity ^= res[j-1]
        
        if parity != 0:
            error_pos += pos
        steps.append(f"Parity check at {pos}: result {parity}")
        
    is_valid = error_pos == 0
    corrected_data = list(res)
    
    if not is_valid and error_pos <= n:
        corrected_data[error_pos-1] ^= 1
        steps.append(f"Error detected at position {error_pos}. Flipping bit.")
    elif not is_valid:
        steps.append("Error detected but position is out of range.")
        
    # Extract data bits
    data_bits = []
    j = 0
    for i in range(1, n + 1):
        if i != 2**j:
            data_bits.append(str(corrected_data[i-1]))
        else:
            j += 1
            
    return {
        "is_valid": is_valid,
        "error_pos": error_pos,
        "corrected_encoded": "".join(str(bit) for bit in corrected_data),
        "data_only": "".join(data_bits),
        "steps": steps
    }

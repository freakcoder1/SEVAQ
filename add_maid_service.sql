INSERT INTO service (
    id, 
    "publicId", 
    name, 
    category, 
    "basePrice", 
    description, 
    "isAvailable", 
    "whatWillHappen", 
    "whatWillNotHappen", 
    "ifSomethingGoesWrong", 
    "createdAt", 
    "updatedAt"
) VALUES (
    nextval('service_id_seq'), 
    'a1b2c3d4-5678-90ef-1234-567890abcdef', 
    'Maid Service', 
    'Maid', 
    600.00, 
    'Professional maid service for your home', 
    true, 
    '{"Helper will arrive and confirm task", "Work done with standard tools"}', 
    '{"No upselling without approval", "No extra work added silently"}', 
    'Sevaq will replace or refund immediately', 
    NOW(), 
    NOW()
) ON CONFLICT DO NOTHING;

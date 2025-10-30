-- Fix get_jwt_wallet_address to also read from user_metadata.wallet_address
CREATE OR REPLACE FUNCTION public.get_jwt_wallet_address()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  jwt_claims json;
  wallet_addr text;
  sub_claim text;
BEGIN
  -- Get JWT claims
  jwt_claims := current_setting('request.jwt.claims', true)::json;
  
  -- Prefer explicit wallet_address claim if present
  wallet_addr := COALESCE(
    jwt_claims ->> 'wallet_address',
    (jwt_claims -> 'user_metadata' ->> 'wallet_address')
  );
  
  -- Fallback: try sub claim (commonly used to carry wallet for Web3 auth)
  sub_claim := jwt_claims ->> 'sub';
  
  -- If no explicit wallet in claims, consider sub only if it doesn't look like a UUID
  IF (wallet_addr IS NULL OR wallet_addr = '') THEN
    IF sub_claim IS NOT NULL AND sub_claim <> '' AND 
       (LENGTH(sub_claim) > 32 OR sub_claim !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
      wallet_addr := sub_claim;
    END IF;
  END IF;
  
  -- Return wallet address if present and not obviously a UUID
  IF wallet_addr IS NOT NULL AND wallet_addr <> '' AND 
     (LENGTH(wallet_addr) > 32 OR wallet_addr !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
    RETURN wallet_addr;
  END IF;
  
  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;
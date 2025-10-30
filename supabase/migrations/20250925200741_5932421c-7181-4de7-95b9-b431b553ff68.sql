-- Fix the JWT wallet address extractor to properly handle web3 authentication
CREATE OR REPLACE FUNCTION public.get_jwt_wallet_address()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  jwt_claims json;
  wallet_addr text;
BEGIN
  -- Get JWT claims
  jwt_claims := current_setting('request.jwt.claims', true)::json;
  
  -- Try to get wallet address from wallet_address claim first
  wallet_addr := jwt_claims ->> 'wallet_address';
  
  -- If not found, try sub claim (for web3 addresses)
  IF wallet_addr IS NULL OR wallet_addr = '' THEN
    wallet_addr := jwt_claims ->> 'sub';
  END IF;
  
  -- Return the wallet address if it looks like a valid address (not a UUID)
  IF wallet_addr IS NOT NULL AND wallet_addr != '' AND 
     (LENGTH(wallet_addr) > 32 OR wallet_addr !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
    RETURN wallet_addr;
  END IF;
  
  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Reassign credit_card_transactions from old card IDs to shared workspace card IDs
UPDATE credit_card_transactions 
SET workspace_id = 'bc8aa563-aadf-4958-a610-fe1d138b17d0',
    credit_card_id = '276d9726-8097-4f3b-921d-9af971481d8f'
WHERE user_id = 'a6936bc8-aa44-4914-bd0b-d66ed851846c' 
  AND workspace_id = '37a63326-a957-499c-8765-dbe655119a13'
  AND credit_card_id = '581330f0-3c4d-4d17-8b49-6cb5d6802e25';

UPDATE credit_card_transactions 
SET workspace_id = 'bc8aa563-aadf-4958-a610-fe1d138b17d0',
    credit_card_id = '00588f7e-3e6f-4490-92dd-2cfd52cef372'
WHERE user_id = 'a6936bc8-aa44-4914-bd0b-d66ed851846c' 
  AND workspace_id = '37a63326-a957-499c-8765-dbe655119a13'
  AND credit_card_id = '197dac69-70f2-436e-92fc-a0d3860bcb17';

-- Reassign statement_imports
UPDATE statement_imports 
SET workspace_id = 'bc8aa563-aadf-4958-a610-fe1d138b17d0',
    credit_card_id = '276d9726-8097-4f3b-921d-9af971481d8f'
WHERE user_id = 'a6936bc8-aa44-4914-bd0b-d66ed851846c' 
  AND workspace_id = '37a63326-a957-499c-8765-dbe655119a13'
  AND credit_card_id = '581330f0-3c4d-4d17-8b49-6cb5d6802e25';

UPDATE statement_imports 
SET workspace_id = 'bc8aa563-aadf-4958-a610-fe1d138b17d0',
    credit_card_id = '00588f7e-3e6f-4490-92dd-2cfd52cef372'
WHERE user_id = 'a6936bc8-aa44-4914-bd0b-d66ed851846c' 
  AND workspace_id = '37a63326-a957-499c-8765-dbe655119a13'
  AND credit_card_id = '197dac69-70f2-436e-92fc-a0d3860bcb17';

-- Move remaining transactions
UPDATE transactions SET workspace_id = 'bc8aa563-aadf-4958-a610-fe1d138b17d0' 
WHERE user_id = 'a6936bc8-aa44-4914-bd0b-d66ed851846c' 
  AND workspace_id = '37a63326-a957-499c-8765-dbe655119a13';

-- Delete old duplicate credit cards
DELETE FROM credit_cards 
WHERE user_id = 'a6936bc8-aa44-4914-bd0b-d66ed851846c' 
  AND workspace_id = '37a63326-a957-499c-8765-dbe655119a13';

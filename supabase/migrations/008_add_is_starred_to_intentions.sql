-- Add is_starred column to intentions table
alter table intentions 
add column is_starred boolean default false;

-- Update existing rows to have false (already handled by default, but good for clarity)
update intentions set is_starred = false where is_starred is null;

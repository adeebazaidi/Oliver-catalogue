# Supabase Database Setup

To enable multi-user, cross-device synchronization for your products and categories, follow these steps to set up your free Supabase database:

## 1. Create a Project on Supabase
1. Go to [supabase.com](https://supabase.com/) and sign up / sign in.
2. Click **New Project** and select your organization.
3. Choose a project name, database password, and region, then click **Create new project**.

## 2. Initialize Database Tables
1. Once your project is ready, click on **SQL Editor** in the left sidebar menu (looks like `>_`).
2. Click **New Query**.
3. Copy and paste the SQL code block below, and click **Run**:

```sql
-- Create products table
create table products (
  id uuid primary key,
  name text not null,
  size text,
  price numeric(10,2) default 0.00,
  materials text[] default '{}',
  buyer_categories text[] default '{}',
  category text,
  image_url text,
  favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable real-time for products
alter publication supabase_realtime add table products;

-- Create categories table
create table categories (
  name text primary key
);

-- Enable real-time for categories
alter publication supabase_realtime add table categories;

-- Create materials table
create table materials (
  name text primary key
);

-- Enable real-time for materials
alter publication supabase_realtime add table materials;

-- Create buyer_categories table
create table buyer_categories (
  name text primary key
);

-- Enable real-time for buyer_categories
alter publication supabase_realtime add table buyer_categories;
```

## 3. Link the Database to Your Application
1. In the Supabase Dashboard, click on the **Project Settings** gear icon at the bottom of the left sidebar.
2. Select **API**.
3. Locate the two credentials:
   - **Project URL** (under Project API keys)
   - **anon / public** (under Project API keys)
4. Create a file named `.env` in the root of your project directory (you can copy `.env.example`).
5. Populate the keys like this:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

6. Re-run `npm run build` and redeploy. The application will automatically detect these credentials and sync all users and devices!

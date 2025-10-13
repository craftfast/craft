# Database Migration Guide

## Required Migration

This implementation requires a database schema update to add the `files` field to the Project model.

## Steps to Apply Migration

### 1. Ensure Database is Running

Make sure your PostgreSQL database is accessible and the connection string in `.env` is correct.

### 2. Run the Migration

```bash
npx prisma migrate dev --name add_files_to_project
```

This will:

- Create a new migration file
- Update the database schema to add the `files` JSON field
- Set default value to `{}`

### 3. Generate Prisma Client

```bash
npx prisma generate
```

This will:

- Update TypeScript types
- Remove the need for `as any` type assertions in the code

### 4. Remove Type Assertions (Optional Cleanup)

After generating the Prisma client, you can optionally clean up the type assertions in `src/app/api/files/route.ts`:

**Before:**

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const files = ((project as any).files as Record<string, string>) || {};
```

**After:**

```typescript
const files = (project.files as Record<string, string>) || {};
```

And:

**Before:**

```typescript
data: { files } as any,
```

**After:**

```typescript
data: { files },
```

## Migration File Preview

The migration will create a file similar to this:

```sql
-- AlterTable
ALTER TABLE "projects" ADD COLUMN "files" JSONB DEFAULT '{}';
```

## Rollback (If Needed)

If you need to rollback this migration:

```bash
npx prisma migrate reset
```

⚠️ **Warning**: This will reset your entire database. Only use in development.

## Testing After Migration

After running the migration, test that:

1. ✅ Existing projects still load correctly
2. ✅ New files can be saved via the API
3. ✅ Files persist across page reloads
4. ✅ File tree displays correctly
5. ✅ Code editor can load and save files

## Common Issues

### Issue: "Can't reach database server"

**Solution**: Check your `DATABASE_URL` in `.env` and ensure the database is running.

### Issue: "Migration conflicts"

**Solution**: If you have existing migrations, you may need to:

```bash
npx prisma migrate resolve --applied <migration_name>
```

### Issue: "Type errors after migration"

**Solution**: Make sure to run `npx prisma generate` after the migration.

## Production Deployment

When deploying to production:

1. Run migrations as part of your deployment process
2. Use `npx prisma migrate deploy` instead of `migrate dev`
3. Ensure `npx prisma generate` runs in your build step

Example in `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

## Database Considerations

### Storage

JSON fields can grow large if many files are stored. Consider:

- Limiting file size per project
- Implementing pagination for file lists
- Moving to a separate File model for large projects

### Performance

- JSON operations in PostgreSQL are efficient
- Indexing can be added if needed for file searches
- Consider caching frequently accessed files

### Alternative Approaches

For production, you might want to:

- Store large files in object storage (S3, etc.)
- Keep only file metadata in database
- Use a separate microservice for file management

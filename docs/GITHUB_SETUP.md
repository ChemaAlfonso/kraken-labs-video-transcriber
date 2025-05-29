# GitHub Setup for Automated Releases

## Required Repository Settings

### 1. GitHub Actions Permissions

1. Go to your GitHub repository
2. Click **Settings** → **Actions** → **General**
3. Under "Workflow permissions", ensure one of these is selected:
    - ✅ **"Read and write permissions"** (Recommended)
    - ✅ **"Restricted permissions"** + manually check "Allow GitHub Actions to create and approve pull requests"

### 2. Repository Access

Make sure your repository:

-   ✅ Has GitHub Actions enabled (should be by default)
-   ✅ Allows workflows to create releases

## Testing the Setup

### Quick Test (Recommended)

1. **Create a test tag** to verify everything works:

    ```bash
    # Create a simple test tag
    git tag v0.1.0-test
    git push origin v0.1.0-test
    ```

2. **Check GitHub Actions**:

    - Go to your repo → **Actions** tab
    - You should see the "Release" workflow running
    - If it fails, check the error logs

3. **Clean up the test**:
    ```bash
    # Delete the test tag
    git tag -d v0.1.0-test
    git push origin :refs/tags/v0.1.0-test
    # Delete the test release from GitHub web interface
    ```

### Manual Workflow Test

You can also test manually:

1. Go to your repo → **Actions** tab
2. Click **"Release"** workflow
3. Click **"Run workflow"**
4. Enter a test tag like `v0.1.0-test`
5. Click **"Run workflow"**

## No Personal Access Token Needed

❌ **You DON'T need to**:

-   Create a Personal Access Token (PAT)
-   Add any secrets to your repository
-   Configure OAuth apps
-   Set up any external authentication

✅ **GitHub automatically provides**:

-   `GITHUB_TOKEN` with necessary permissions
-   Access to create releases
-   Access to upload assets

## Troubleshooting

### If the workflow fails with permission errors:

1. **Check workflow permissions** (Settings → Actions → General)
2. **Verify the repository isn't private** with restricted settings
3. **Check if your organization** has any GitHub Actions restrictions

### If builds succeed but release creation fails:

1. **Check if the tag already exists**
2. **Verify you have admin/write access** to the repository
3. **Look at the workflow logs** for specific error messages

### Common Error Messages:

-   `"Resource not accessible by integration"` → Check workflow permissions
-   `"Tag already exists"` → Delete the existing tag or use a new version
-   `"Not found"` → Repository might be private with wrong settings

## Ready to Go!

Once you've verified the settings above, you can start creating releases:

```bash
# 1. Update version
npm version patch

# 2. Commit and push
git add package.json package-lock.json
git commit -m "chore: bump version to v0.1.1"
git push origin main

# 3. Create release
npm run release:tag
```

Your first release should build automatically! 🚀

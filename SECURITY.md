# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions of Essential Tokens:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 1.0.x   | ✅ Current         | Active development |
| < 1.0   | ❌ Not supported   | Legacy |

## Security οverview

Essential Tokens is a Figma plugin that processes CSS input to create design tokens.

### We do:
- ✅ **No external network requests** - Plugin works entirely offline
- ✅ **Input sanitization** - CSS parsing is safe and contained
- ✅ **No eval() usage** - No dynamic code execution
- ✅ **Limited Figma API access** - Only creates variables, no file access
- ✅ **Open source** - All code is publicly auditable
- ✅ **Dependency scanning** - Regular vulnerability checks

### We don't:
- ❌ **No data collection** - We don't collect or store user data
- ❌ **No telemetry** - No usage tracking or analytics
- ❌ **No file system access** - Only processes CSS text input
- ❌ **No remote connections** - Plugin runs entirely in Figma's sandbox

## Reporting a vulnerability


If you discover a security vulnerability, please report it privately:

**Contact Method:**
- **Email**: [Your security email - replace with your actual email]
- **Subject Line**: "Essential Tokens Security Vulnerability"
- **Alternative**: Create a [GitHub Security Advisory](https://github.com/sochar3/essential-tokens/security/advisories/new)

### What to Include

Please provide the following information:

1. **Description** - Clear description of the vulnerability
2. **Steps to Reproduce** - How to trigger the security issue
3. **Impact Assessment** - What could an attacker potentially do?
4. **Proof of Concept** - If safe to share, include a minimal example
5. **Suggested Fix** - If you have ideas for remediation

### Example Report Format

```
Subject: Essential Tokens Security Vulnerability

Description:
[Clear description of the security issue]

Steps to Reproduce:
1. [Step one]
2. [Step two]
3. [Impact observed]

Impact:
[What could happen if this is exploited]

CSS Input (if applicable):
[The CSS that triggers the issue]

Environment:
- Figma Version: [version]
- Plugin Version: [version]
- OS: [operating system]

Suggested Fix:
[Your recommendations if any]
```



## Security best practices for users

### Safe Usage
- ✅ **Use in Figma Desktop App** - Most secure environment
- ✅ **Review CSS before pasting** - Don't paste untrusted CSS
- ✅ **Keep Figma updated** - Use latest version for security patches
- ✅ **Verify plugin source** - Only install from official sources

### Pls avoid:
- ❌ **Don't paste untrusted CSS** - Only use CSS from trusted sources
- ❌ **Don't use in shared/public Figma files** with sensitive data
- ❌ **Don't modify plugin files** - Could introduce security issues

## Types of Security Issues We Consider

### High Severity
- Code execution vulnerabilities
- Unauthorized Figma API access
- Data exfiltration risks
- Plugin sandbox escape

### Medium Severity  
- Input validation bypasses
- Denial of service attacks
- Memory exhaustion
- Malformed CSS processing issues

### Low Severity
- UI spoofing concerns
- Error message information disclosure
- Performance degradation attacks

## Security Development Practices

### Code Security
- **Input validation** - All CSS input is properly parsed and validated
- **Error handling** - Graceful failure without exposing internals
- **Type safety** - TypeScript provides compile-time safety
- **Code review** - All changes require owner approval

### Dependencies
- **Regular updates** - Dependencies are kept current
- **Vulnerability scanning** - Automated checks for known issues
- **Minimal dependencies** - Only essential packages included
- **Source verification** - All packages are from trusted sources

### Build Security
- **Reproducible builds** - Consistent build process
- **Signed releases** - Future consideration for plugin distribution
- **Build isolation** - No external network access during build
- **Artifact verification** - Build outputs are verified

## Figma Plugin Security Model

Essential Tokens operates within Figma's plugin security model:

### Sandbox Limitations
- **Limited API access** - Only specific Figma APIs are available
- **No file system** - Cannot access local files
- **No network** - Cannot make external requests
- **Isolated execution** - Runs in a sandboxed environment

### Permissions Required
- **Create variables** - To generate design tokens
- **Read existing variables** - For scanning functionality
- **UI display** - To show the plugin interface

## Responsible Disclosure

We follow responsible disclosure practices:

1. **Private reporting** - Security issues reported privately first
2. **Coordinated release** - Fixes released before public disclosure
3. **Credit given** - Security researchers receive appropriate credit
4. **Community notification** - Users notified of security updates

## Security Updates

### How We Communicate Security Updates
- **GitHub Security Advisories** - For documented vulnerabilities
- **Release Notes** - Security fixes noted in releases
- **README Updates** - Important security information
- **Direct Contact** - For users who reported issues

### Update Recommendations
- **Stay Current** - Always use the latest version
- **Monitor Releases** - Watch for security-related updates
- **Test Updates** - Verify functionality after security updates
- **Report Issues** - Let us know if updates cause problems

## Security Resources

### For Developers Contributing
- **Secure Coding Guidelines** - See CONTRIBUTING.md
- **Code Review Process** - All PRs require approval
- **Testing Requirements** - Security implications considered
- **Dependency Management** - Regular security audits

### For Users
- **Figma Security** - [Figma's Security Documentation](https://help.figma.com/hc/en-us/articles/360039827154)
- **Plugin Safety** - Best practices for using Figma plugins
- **CSS Security** - Be cautious with untrusted CSS sources

---

## Contact Information

**Security Team**: @sochar3  
**General Issues**: GitHub Issues (for non-security bugs)  
**Security Issues**: [Your security email] (private disclosure)

Thank you for helping keep Essential Tokens secure! 🔒 

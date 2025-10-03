# Development Prevention Checklist

This checklist helps prevent common issues in the Wedding Platform codebase based on incident analysis and lessons learned.

## 🎨 CSS & Styling Checklist

### Color Management
- [ ] **No Hardcoded Colors**: Avoid hardcoded hex colors in components - use CSS variables or theme colors
- [ ] **CSS Variable Fallbacks**: Ensure robust fallback chains: `textColor || primary || defaultColor`
- [ ] **Theme Color Validation**: Verify template configs populate all required color properties
- [ ] **Cross-Template Testing**: Test color changes across all template types (Pro, Classic, Elegant, Nature, Romantic)

### CSS Variables
- [ ] **Variable Definition**: Ensure CSS variables are set in `useEffect` before component render
- [ ] **Browser Dev Tools Check**: Verify CSS variables appear in `:root` styles (not "undefined")
- [ ] **Fallback Logic**: Provide multiple fallback levels for missing theme properties
- [ ] **useEffect Dependencies**: Include all color properties that affect CSS variable setting

## 🌐 Template System Checklist

### Configuration Management
- [ ] **Schema Alignment**: Ensure TypeScript interfaces match database schema structure
- [ ] **Default Config Coverage**: Verify default configs provide all required properties
- [ ] **Admin Panel Sync**: Test that admin panel changes reflect in template rendering
- [ ] **Template-Specific Testing**: Each template type has unique config requirements

### Component Props
- [ ] **Safe Config Access**: Use optional chaining (`config?.theme?.colors?.primary`)
- [ ] **Graceful Degradation**: Components work even with missing config properties
- [ ] **Type Safety**: Leverage TypeScript to catch config mismatches early
- [ ] **Prop Validation**: Validate critical props with default values

## 🔤 Armenian Font & Internationalization

### Font Provider
- [ ] **Debug Logging**: Include console.log for CSS injection debugging in development
- [ ] **Cache Invalidation**: Implement proper cache-busting for runtime CSS changes
- [ ] **Performance Impact**: Monitor ArmenianFontProvider performance on page load
- [ ] **Cross-Browser Testing**: Verify Armenian text renders correctly across browsers

### Text Handling
- [ ] **UTF-8 Encoding**: Ensure proper character encoding for Armenian text
- [ ] **Font Fallbacks**: Provide web-safe Armenian font alternatives
- [ ] **Text Direction**: Handle RTL/LTR text direction correctly
- [ ] **Responsive Text**: Armenian text scales properly on mobile devices

## 🧪 Testing Checklist

### Before Code Changes
- [ ] **Baseline Screenshots**: Capture current state for visual regression comparison
- [ ] **Browser Dev Tools**: Document current CSS variable states
- [ ] **Error Console**: Check for existing JavaScript/CSS errors
- [ ] **Template Load Testing**: Verify all templates load without errors

### After Code Changes
- [ ] **Hard Refresh Test**: Clear cache and test changes in incognito mode
- [ ] **CSS Variable Verification**: Confirm variables are set correctly in dev tools
- [ ] **Cross-Template Validation**: Test changes don't break other templates
- [ ] **Mobile Responsiveness**: Verify changes work on mobile viewport

### Deployment Testing
- [ ] **Production Environment**: Test in production-like environment
- [ ] **CDN Cache**: Consider CDN cache invalidation for CSS changes
- [ ] **A/B Testing**: Gradual rollout for significant styling changes
- [ ] **Rollback Plan**: Have immediate rollback capability for critical issues

## 🏗️ Architecture Best Practices

### Component Design
- [ ] **Single Responsibility**: Each component has one clear purpose
- [ ] **Prop Interface**: Clear TypeScript interfaces for all component props
- [ ] **Error Boundaries**: Wrap risky components in error boundaries
- [ ] **Performance Optimization**: Use React.memo for expensive re-renders

### State Management
- [ ] **CSS Variable Updates**: Update CSS variables when theme state changes
- [ ] **useEffect Cleanup**: Clean up side effects in component unmount
- [ ] **Dependency Arrays**: Accurate dependency arrays for useEffect hooks
- [ ] **State Synchronization**: Keep component state in sync with global config

## 🐛 Debug & Monitoring

### Development Tools
- [ ] **Console Logging**: Strategic console.log for debugging complex flows
- [ ] **Network Tab**: Monitor API calls for config loading
- [ ] **Performance Tab**: Check for performance regressions
- [ ] **Source Maps**: Ensure source maps work for debugging

### Error Handling
- [ ] **Graceful Failures**: Components handle errors without breaking entire page
- [ ] **User Feedback**: Clear error messages for users when things go wrong
- [ ] **Logging Strategy**: Log errors to help with future debugging
- [ ] **Fallback Content**: Show meaningful fallback when components fail

## 📚 Documentation

### Code Documentation
- [ ] **Component Comments**: Document complex logic and workarounds
- [ ] **TypeScript Types**: Comprehensive type definitions
- [ ] **Config Examples**: Provide example configurations
- [ ] **Migration Guides**: Document breaking changes and migration steps

### Process Documentation
- [ ] **Incident Reports**: Create incident reports for significant bugs
- [ ] **Architecture Decisions**: Document architectural choices and trade-offs
- [ ] **Testing Procedures**: Maintain testing checklists and procedures
- [ ] **Deployment Guides**: Keep deployment documentation current

---

## 🚨 Red Flags (Stop and Investigate)

- ❌ Hardcoded colors in template components
- ❌ CSS variables showing as "undefined" in browser dev tools
- ❌ useEffect dependencies missing config properties
- ❌ Template configs missing required theme properties
- ❌ ArmenianFontProvider errors in console
- ❌ Different colors between admin panel and live site
- ❌ Browser cache preventing style updates
- ❌ Console errors during template rendering

---

*Checklist Version: 1.0*  
*Created: 2025-10-03*  
*Based on Incident: INC-2025-10-03-001*
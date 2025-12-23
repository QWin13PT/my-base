/**
 * Supabase Client Configuration
 * Browser client for Next.js App Router (SSR-compatible)
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  });
}

// Create browser client that works with SSR
// Note: createBrowserClient will handle missing credentials gracefully
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Database helper functions
 */

/**
 * Get or create user by wallet address
 * @param {string} walletAddress - User's wallet address
 * @returns {Promise<Object>} User object
 */
export async function getOrCreateUser(walletAddress) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  const normalizedAddress = walletAddress.toLowerCase();

  // Try to get existing user
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', normalizedAddress)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching user:', fetchError);
    throw new Error(`Failed to fetch user: ${fetchError.message}`);
  }

  if (existingUser) {
    console.log('✅ User found:', existingUser.id);
    return existingUser;
  }

  // Create new user if not found
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert([{ wallet_address: normalizedAddress }])
    .select()
    .single();

  if (createError) {
    console.error('Failed to create user:', createError);
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  console.log('✅ New user created:', newUser.id);
  return newUser;
}

/**
 * Get user layouts with their widgets
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of layouts with widgets
 */
export async function getUserLayouts(userId) {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { data, error } = await supabase
    .from('layouts')
    .select(`
      *,
      widget_settings (*)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch layouts: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single layout with widgets
 * @param {string} layoutId - Layout ID
 * @returns {Promise<Object>} Layout with widgets
 */
export async function getLayoutWithWidgets(layoutId) {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { data, error } = await supabase
    .from('layouts')
    .select(`
      *,
      widget_settings (*)
    `)
    .eq('id', layoutId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch layout: ${error.message}`);
  }

  return data;
}

/**
 * Create a new layout
 * @param {string} userId - User ID
 * @param {Object} layoutData - Layout configuration
 * @returns {Promise<Object>} Created layout
 */
export async function createLayout(userId, layoutData) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data: layout, error: layoutError } = await supabase
    .from('layouts')
    .insert([{
      user_id: userId,
      name: layoutData.name,
      is_default: layoutData.isDefault || false,
      is_public: layoutData.isPublic || false,
    }])
    .select()
    .single();

  if (layoutError) {
    throw new Error(`Failed to create layout: ${layoutError.message}`);
  }

  return layout;
}

/**
 * Update a layout
 * @param {string} layoutId - Layout ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated layout
 */
export async function updateLayout(layoutId, updates) {
  const { data, error } = await supabase
    .from('layouts')
    .update(updates)
    .eq('id', layoutId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update layout: ${error.message}`);
  }

  return data;
}

/**
 * Delete a layout (widgets are auto-deleted via cascade)
 * @param {string} layoutId - Layout ID
 * @returns {Promise<void>}
 */
export async function deleteLayout(layoutId) {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { error } = await supabase
    .from('layouts')
    .delete()
    .eq('id', layoutId);

  if (error) {
    throw new Error(`Failed to delete layout: ${error.message}`);
  }
}

/**
 * Add a widget to a layout
 * @param {string} layoutId - Layout ID
 * @param {Object} widgetData - Widget configuration
 * @returns {Promise<Object>} Created widget
 */
export async function addWidgetToLayout(layoutId, widgetData) {
  const { data, error } = await supabase
    .from('widget_settings')
    .insert([{
      layout_id: layoutId,
      widget_type: widgetData.widgetType,
      position_x: widgetData.x || 0,
      position_y: widgetData.y || 0,
      width: widgetData.width || 2,
      height: widgetData.height || 2,
      config: widgetData.config || {},
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add widget: ${error.message}`);
  }

  return data;
}

/**
 * Update a widget
 * @param {string} widgetId - Widget ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated widget
 */
export async function updateWidget(widgetId, updates) {
  const { data, error } = await supabase
    .from('widget_settings')
    .update(updates)
    .eq('id', widgetId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update widget: ${error.message}`);
  }

  return data;
}

/**
 * Delete a widget
 * @param {string} widgetId - Widget ID
 * @returns {Promise<void>}
 */
export async function deleteWidget(widgetId) {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { error } = await supabase
    .from('widget_settings')
    .delete()
    .eq('id', widgetId);

  if (error) {
    throw new Error(`Failed to delete widget: ${error.message}`);
  }
}

/**
 * Get public templates with widgets
 * @param {number} limit - Number of templates to fetch
 * @param {string} sortBy - Sort by 'likes', 'copies', or 'created_at'
 * @returns {Promise<Array>} Array of templates with widgets
 */
export async function getPublicTemplates(limit = 20, sortBy = 'likes') {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      users (wallet_address, username),
      template_widgets (*)
    `)
    .order(sortBy, { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a template from a layout
 * @param {string} userId - Creator user ID
 * @param {string} layoutId - Layout to convert to template
 * @param {Object} templateData - Template metadata
 * @returns {Promise<Object>} Created template
 */
export async function createTemplate(userId, layoutId, templateData) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Get the layout with widgets
  const layout = await getLayoutWithWidgets(layoutId);

  // Create the template
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .insert([{
      creator_id: userId,
      name: templateData.name,
      description: templateData.description,
      preview_image: templateData.previewImage,
    }])
    .select()
    .single();

  if (templateError) {
    throw new Error(`Failed to create template: ${templateError.message}`);
  }

  // Copy widgets to template_widgets
  if (layout.widget_settings && layout.widget_settings.length > 0) {
    const templateWidgets = layout.widget_settings.map(widget => ({
      template_id: template.id,
      widget_type: widget.widget_type,
      position_x: widget.position_x,
      position_y: widget.position_y,
      width: widget.width,
      height: widget.height,
      config: widget.config,
    }));

    const { error: widgetsError } = await supabase
      .from('template_widgets')
      .insert(templateWidgets);

    if (widgetsError) {
      throw new Error(`Failed to copy widgets to template: ${widgetsError.message}`);
    }
  }

  return template;
}

/**
 * Copy a template to user's layouts
 * @param {string} userId - User ID
 * @param {string} templateId - Template ID to copy
 * @param {string} layoutName - Name for the new layout
 * @returns {Promise<Object>} Created layout
 */
export async function copyTemplate(userId, templateId, layoutName) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Get the template with widgets
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select(`
      *,
      template_widgets (*)
    `)
    .eq('id', templateId)
    .single();

  if (templateError) {
    throw new Error(`Failed to fetch template: ${templateError.message}`);
  }

  // Create new layout
  const layout = await createLayout(userId, { name: layoutName });

  // Copy widgets from template
  if (template.template_widgets && template.template_widgets.length > 0) {
    const widgets = template.template_widgets.map(widget => ({
      layout_id: layout.id,
      widget_type: widget.widget_type,
      position_x: widget.position_x,
      position_y: widget.position_y,
      width: widget.width,
      height: widget.height,
      config: widget.config,
    }));

    const { error: widgetsError } = await supabase
      .from('widget_settings')
      .insert(widgets);

    if (widgetsError) {
      throw new Error(`Failed to copy widgets: ${widgetsError.message}`);
    }
  }

  // Increment template copies count
  await supabase
    .from('templates')
    .update({ copies: template.copies + 1 })
    .eq('id', templateId);

  return layout;
}

/**
 * Like a template
 * @param {string} templateId - Template ID
 * @returns {Promise<void>}
 */
export async function likeTemplate(templateId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data: template } = await supabase
    .from('templates')
    .select('likes')
    .eq('id', templateId)
    .single();

  if (template) {
    await supabase
      .from('templates')
      .update({ likes: template.likes + 1 })
      .eq('id', templateId);
  }
}

/**
 * Check if Supabase is available
 * @returns {boolean}
 */
export const isSupabaseAvailable = () => supabase !== null;


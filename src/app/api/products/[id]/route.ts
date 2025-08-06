import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, productInventory, productTags, tags, tagGroups } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    // Fetch product with category and inventory details
    const productWithDetails = await db
      .select({
        product: {
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          shortDescription: products.shortDescription,
          price: products.price,
          comparePrice: products.comparePrice,
          images: products.images,
          thc: products.thc,
          cbd: products.cbd,
          isActive: products.isActive,
          isFeatured: products.isFeatured,
          tags: products.tags,
          difficulty: products.difficulty,
          floweringTime: products.floweringTime,
          yieldAmount: products.yieldAmount,
          createdAt: products.createdAt,
        },
        category: {
          name: categories.name,
          slug: categories.slug,
        },
        inventory: {
          quantity: productInventory.quantity,
          availableQuantity: productInventory.availableQuantity,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(productInventory, eq(productInventory.productId, products.id))
      .where(and(eq(products.id, productId), eq(products.isActive, true)))
      .groupBy(products.id, categories.id)
      .limit(1);

    if (productWithDetails.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const item = productWithDetails[0];

    // Fetch product tags with their groups
    const productTagsWithGroups = await db
      .select({
        tag: {
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          description: tags.description,
          color: tags.color,
          icon: tags.icon,
          isCustom: tags.isCustom,
          customValue: tags.customValue,
          sortOrder: tags.sortOrder,
        },
        group: {
          id: tagGroups.id,
          name: tagGroups.name,
          slug: tagGroups.slug,
          description: tagGroups.description,
          color: tagGroups.color,
          icon: tagGroups.icon,
        },
        productTag: {
          customValue: productTags.customValue,
          sortOrder: productTags.sortOrder,
        },
      })
      .from(productTags)
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .innerJoin(tagGroups, eq(tags.groupId, tagGroups.id))
      .where(and(
        eq(productTags.productId, productId),
        eq(tags.isActive, true),
        eq(tagGroups.isActive, true)
      ))
      .orderBy(tagGroups.sortOrder, tags.sortOrder);

    // Parse JSON fields safely
    let images: string[] = [];
    let legacyTags: string[] = [];
    
    // Process tags by group
    const tagsByGroup: Record<string, Array<{
      id: string;
      name: string;
      description?: string;
      color?: string;
      icon?: string;
      customValue?: string;
    }>> = {};
    
    productTagsWithGroups.forEach(item => {
      const groupSlug = item.group.slug;
      if (!tagsByGroup[groupSlug]) {
        tagsByGroup[groupSlug] = [];
      }
      
      tagsByGroup[groupSlug].push({
        id: item.tag.id,
        name: item.productTag.customValue || item.tag.customValue || item.tag.name,
        description: item.tag.description || undefined,
        color: item.tag.color || item.group.color || undefined,
        icon: item.tag.icon || item.group.icon || undefined,
        customValue: item.productTag.customValue || undefined,
      });
    });

    // Parse images
    try {
      if (item.product.images) {
        let imageData = item.product.images;
        
        // Handle string data (which is common from database)
        if (typeof imageData === 'string') {
          // This handles the double-encoded JSON format from database
          try {
            // First, parse the outer quotes
            imageData = JSON.parse(imageData);
            // Then parse the inner JSON array
            if (typeof imageData === 'string') {
              imageData = JSON.parse(imageData);
            }
          } catch (e) {
            // If parsing fails, maybe it's just a URL string
            if (typeof imageData === 'string' && (imageData.includes('http') || imageData.includes('/'))) {
              // Extract URL from malformed JSON
              const urlMatch = imageData.match(/https?:\/\/[^\\"]+/);
              if (urlMatch) {
                imageData = [urlMatch[0]];
              } else {
                imageData = [];
              }
            } else {
              imageData = [];
            }
          }
        }
        
        images = Array.isArray(imageData) ? imageData : (imageData ? [imageData] : []);
      }
    } catch (e) {
      console.warn('Failed to parse product images:', e);
      images = [];
    }

    // Parse legacy tags (JSON field in products table)
    try {
      if (item.product.tags) {
        const tagData = typeof item.product.tags === 'string' 
          ? JSON.parse(item.product.tags) 
          : item.product.tags;
        legacyTags = Array.isArray(tagData) ? tagData : [];
      }
    } catch (e) {
      console.warn('Failed to parse product legacy tags:', e);
      legacyTags = [];
    }



    // Transform the data
    const transformedProduct = {
      id: item.product.id,
      name: item.product.name,
      category: item.category?.name || 'Uncategorized',
      categorySlug: item.category?.slug || 'uncategorized',
      price: parseFloat(item.product.price?.toString() || '0'),
      comparePrice: item.product.comparePrice ? parseFloat(item.product.comparePrice.toString()) : null,
      image: images[0] || '/placeholder-product.jpg', // First image or placeholder
      images: images,
      description: item.product.description || item.product.shortDescription || '',
      shortDescription: item.product.shortDescription || '',
      thc: parseFloat(item.product.thc?.toString() || '0'),
      cbd: parseFloat(item.product.cbd?.toString() || '0'),
      strain: legacyTags.find(tag => ['indica', 'sativa', 'hybrid'].includes(tag.toLowerCase())) || 'hybrid',
      inStock: (item.inventory?.availableQuantity || item.inventory?.quantity || 0) > 0,
      isFeatured: item.product.isFeatured || false,
      tags: legacyTags,
      // Dynamic tags organized by group
      effects: tagsByGroup['effects'] || tagsByGroup['effect'] || [],
      flavors: tagsByGroup['flavors'] || tagsByGroup['flavor'] || [],
      medicalUses: tagsByGroup['medical-uses'] || tagsByGroup['medical'] || tagsByGroup['benefits'] || tagsByGroup['may-help-with'] || [],
      // All tags organized by group for flexibility
      tagGroups: tagsByGroup,
      growInfo: {
        difficulty: item.product.difficulty || 'Medium',
        flowering: item.product.floweringTime || '8-10 weeks',
        yield: item.product.yieldAmount || 'Medium'
      },
      createdAt: item.product.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedProduct,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}
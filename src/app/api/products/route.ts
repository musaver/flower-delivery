import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, productInventory } from '@/lib/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const categorySlug = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    let whereConditions = [eq(products.isActive, true)];

    // Filter by category if provided
    if (categoryId) {
      whereConditions.push(eq(products.categoryId, categoryId));
    } else if (categorySlug && categorySlug !== 'all') {
      // First get the category ID from slug
      const category = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(
          eq(categories.slug, categorySlug.toLowerCase()),
          eq(categories.isActive, true)
        ))
        .limit(1);

      if (category.length > 0) {
        whereConditions.push(eq(products.categoryId, category[0].id));
      }
    }

    // Fetch products with category information and inventory
    const productsWithDetails = await db
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
          createdAt: products.createdAt,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
        // Get inventory info to determine stock status
        inventory: {
          totalQuantity: sql<number>`COALESCE(SUM(${productInventory.quantity}), 0)`,
        }
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(productInventory, eq(productInventory.productId, products.id))
      .where(and(...whereConditions))
      .groupBy(products.id, categories.id)
      .orderBy(
        desc(sql<number>`COALESCE(SUM(${productInventory.quantity}), 0) > 0`), // In stock first
        desc(products.isFeatured), 
        desc(products.createdAt)
      )
      .limit(limit);

    // Transform the data to match the frontend Product interface
    const transformedProducts = productsWithDetails.map(item => {
      // Parse JSON fields safely
      let images: string[] = [];
      let tags: string[] = [];
      
      try {
        if (item.product.images) {
          let imageData = item.product.images;
          
          // Handle string data (which is common from database)
          if (typeof imageData === 'string') {
            // This handles the double-encoded JSON format from database
            // Example: "\"[\\\"url\\\"]\"" -> ["url"]
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

      try {
        if (item.product.tags) {
          const tagData = typeof item.product.tags === 'string' 
            ? JSON.parse(item.product.tags) 
            : item.product.tags;
          tags = Array.isArray(tagData) ? tagData : [];
        }
      } catch (e) {
        console.warn('Failed to parse product tags:', e);
        tags = [];
      }
      
      return {
        id: item.product.id,
        name: item.product.name,
        category: item.category?.name || 'Uncategorized',
        categorySlug: item.category?.slug || 'uncategorized',
        price: parseFloat(item.product.price?.toString() || '0'),
        comparePrice: item.product.comparePrice ? parseFloat(item.product.comparePrice.toString()) : null,
        image: images[0] || '/placeholder-product.jpg', // First image or placeholder
        images: images,

        description: item.product.shortDescription || item.product.description || '',
        thc: parseFloat(item.product.thc?.toString() || '0'),
        cbd: parseFloat(item.product.cbd?.toString() || '0'),
        strain: tags.find(tag => ['indica', 'sativa', 'hybrid'].includes(tag.toLowerCase())) || 'hybrid',
        inStock: (item.inventory?.totalQuantity || 0) > 0,
        isFeatured: item.product.isFeatured || false,
        tags: tags,
        createdAt: item.product.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedProducts,
      count: transformedProducts.length
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
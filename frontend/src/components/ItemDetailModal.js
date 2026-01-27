import React from 'react'
import { FaTimes, FaEye } from 'react-icons/fa'

/**
 * Modal component for displaying detailed item information including parsed specifications
 */
const ItemDetailModal = ({ item, onClose, isDarkMode }) => {
    if (!item) return null

    // Parse the description to find specification key-value pairs
    const parseSpecifications = description => {
        if (!description) return { specs: [], remainingText: '' }

        // Match patterns like "key:value;" or "key: value;"
        const regex = /([^:;]+):([^;]+);/g
        const specs = []
        let match
        let remainingText = description

        // Find all matches in the description
        while ((match = regex.exec(description)) !== null) {
            const key = match[1].trim()
            const value = match[2].trim()

            if (key && value) {
                specs.push({ key, value })
                    // Remove the matched spec from the remaining text
                remainingText = remainingText.replace(match[0], '')
            }
        }

        // Trim any remaining text
        remainingText = remainingText.trim()

        return { specs, remainingText }
    }

    const { specs, remainingText } = parseSpecifications(item.description)
    const hasSpecs = specs.length > 0

    // Get image URL helper
    const getImageUrl = item => {
        if (!item) return '/images/items/placeholder.png'

        if (item.imageUrl) return item.imageUrl
        if (item.image) {
            if (typeof item.image === 'string') {
                if (
                    item.image.startsWith('data:') ||
                    item.image.startsWith('http') ||
                    item.image.startsWith('/')
                ) {
                    return item.image
                }
                return `/images/items/${item.image}`
            }
        }

        return '/images/items/placeholder.png'
    }

    return ( <
            div className = { `modal-backdrop ${isDarkMode ? 'dark-mode' : ''}` } >
            <
            div className = 'item-detail-modal' >
            <
            div className = 'item-detail-header' >
            <
            h2 className = 'item-detail-title' > Item Details < /h2>{' '} <
            button className = 'item-detail-close'
            onClick = { onClose } >
            <
            FaTimes / >
            <
            /button>{' '} < /
            div > { ' ' } <
            div className = 'item-detail-content' >
            <
            div className = 'item-detail-image-large' >
            <
            img src = { getImageUrl(item) }
            alt = { item.name }
            onError = {
                e => {
                    e.target.onerror = null
                    e.target.src = '/images/items/placeholder.png'
                }
            }
            />{' '} < /
            div > { ' ' } <
            div className = 'item-basic-info' >
            <
            h3 className = 'item-detail-name-large' > { item.name } < /h3>{' '} <
            div className = 'item-detail-category' > { ' ' }
            Category: { item.category } { ' ' } <
            /div>{' '} <
            div className = 'item-detail-price' > { ' ' }₹ { parseFloat(item.price).toFixed(2) } { ' ' } <
            /div>{' '} <
            div className = 'item-detail-stock' > { ' ' } {
                item.quantity > 0 ? (
                    `In Stock: ${item.quantity}`
                ) : ( <
                    span style = {
                        { color: '#ef4444' }
                    } > Out of Stock < /span>
                )
            } { ' ' } <
            /div>{' '} < /
            div > { ' ' } <
            /div>{' '} {
            hasSpecs && ( <
                div className = 'item-specs-section' >
                <
                h4 className = 'item-specs-title' > Specifications < /h4>{' '} <
                div className = 'item-specs-list' > { ' ' } {
                    specs.map((spec, index) => ( <
                        div key = { index }
                        className = 'spec-item' >
                        <
                        div className = 'spec-label' > { spec.key } < /div>{' '} <
                        div className = 'spec-value' > { spec.value } < /div>{' '} < /
                        div >
                    ))
                } { ' ' } <
                /div>{' '} < /
                div >
            )
        } { ' ' } {
            (remainingText || (!hasSpecs && item.description)) && ( <
                div className = 'item-full-description' >
                <
                h4 className = 'item-specs-title' > Description < /h4>{' '} <
                p > { remainingText || item.description } < /p>{' '} < /
                div >
            )
        } { ' ' } <
        /div>{' '} < /
        div >
)
}

export default ItemDetailModal